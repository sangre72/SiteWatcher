import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import './blink.css';

interface ImageResult {
  filename: string;
  similarity: number;
  data: string;
  meta_data: string;
  creation_date: string;
  update_date: string;
  description: string;
  identifier: string;
}

const TextSearch: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<ImageResult[]>([]);
  const [others, setOthers] = useState<ImageResult[]>([]);
  const [isEnterPressed, setIsEnterPressed] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const debounceTimeout = useRef<number | null>(null);

  useEffect(() => {
    const today = new Date();
    const yesterday = new Date(today);
    const tomorrow = new Date(today);
    yesterday.setDate(tomorrow.getDate() - 1);
    tomorrow.setDate(tomorrow.getDate() + 1);

    setStartDate(yesterday);
    setEndDate(tomorrow);
  }, []);

  const addBlinkingClass = () => {
    const rows = document.querySelectorAll('tr');
    rows.forEach(row => {
      row.classList.add('blinking');
    });
    setTimeout(() => {
      rows.forEach(row => {
        row.classList.remove('blinking');
      });
    }, 500);
  };

  const searchImages = async () => {
    try {
      const response = await axios.post('http://localhost:9999/ai/text_search', { query });
      setResults(response.data.matches);
      addBlinkingClass();
    } catch (error) {
      console.error('Error searching images:', error);
      setToastMessage('Error searching images');
      setShowToast(true);
    }
  };

  const retrainModel = async () => {
    if (!startDate || !endDate) {
      setToastMessage('Please select both start and end dates');
      setShowToast(true);
      return;
    }
    try {
      await axios.post('http://localhost:9999/ai/retrain', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });
      setToastMessage('Retraining initiated successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Error retraining model:', error);
      setToastMessage('Error retraining model');
      setShowToast(true);
    }
  };

  const addDescription = async (index: number) => {
    const description = descriptions[index];
    const identifier = results[index].identifier;

    if (!description) {
      setToastMessage('Please enter a description');
      setShowToast(true);
      return;
    }
    try {
      await axios.post('http://localhost:9999/ai/update_description', {
        identifier: identifier,
        description: description
      });
      setToastMessage('Description added successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Error adding description:', error);
      setToastMessage('Error adding description');
      setShowToast(true);
    }
  };

  const handleSearch = () => {
    if (debounceTimeout.current !== null) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = window.setTimeout(() => {
      searchImages();
      debounceTimeout.current = null;
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isEnterPressed) {
      e.preventDefault();
      setIsEnterPressed(true);
      searchButtonRef.current?.click();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEnterPressed(false);
    }
  };

  const handleDescriptionChange = (index: number, value: string) => {
    setDescriptions((prevDescriptions) => {
      const newDescriptions = [...prevDescriptions];
      newDescriptions[index] = value;
      return newDescriptions;
    });
  };

  return (
    <Box sx={{ width: '100%', fontSize: '12px' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
          <TextField
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            placeholder="Enter search query"
            sx={{ width: 300, mt: 2 }}
          />
          <Button
            ref={searchButtonRef}
            variant="contained"
            onClick={handleSearch}
            sx={{ mt: 2 }}
          >
            Search
          </Button>
        </Box>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => setStartDate(date)}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(date) => setEndDate(date)}
              slotProps={{ textField: { size: 'small' } }}
            />
            <Button variant="outlined" onClick={retrainModel}>
              Retrain
            </Button>
          </Box>
        </LocalizationProvider>
      </Box>

      {results.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>검색 결과</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>id</TableCell>
                  <TableCell>Similarity</TableCell>
                  <TableCell>Creation Date</TableCell>
                  <TableCell>Update Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Description Input</TableCell>
                  <TableCell>Add Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell>{result.identifier}</TableCell>
                    <TableCell>{result.similarity.toFixed(6)}</TableCell>
                    <TableCell>{result.creation_date}</TableCell>
                    <TableCell>{result.update_date}</TableCell>
                    <TableCell>{JSON.stringify(result.meta_data)}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={descriptions[index] || ''}
                        onChange={(e) => handleDescriptionChange(index, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => addDescription(index)}>
                        설명추가
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {others.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>기타 결과</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>Image</TableCell>
                  <TableCell>Similarity</TableCell>
                  <TableCell>File Name</TableCell>
                  <TableCell>Creation Date</TableCell>
                  <TableCell>Update Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Description Input</TableCell>
                  <TableCell>Add Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {others.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <img
                        src={`data:image/jpeg;base64,${result.data}`}
                        alt={result.identifier}
                        style={{ maxWidth: '200px', maxHeight: '200px' }}
                      />
                    </TableCell>
                    <TableCell>{result.similarity.toFixed(6)}</TableCell>
                    <TableCell>{result.identifier}</TableCell>
                    <TableCell>{result.creation_date}</TableCell>
                    <TableCell>{result.update_date}</TableCell>
                    <TableCell>{JSON.stringify(result.meta_data)}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={descriptions[index + results.length] || ''}
                        onChange={(e) => handleDescriptionChange(index + results.length, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => addDescription(index + results.length)}>
                        설명추가
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Snackbar
        open={showToast}
        autoHideDuration={3000}
        onClose={() => setShowToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowToast(false)} severity="info" sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TextSearch;
