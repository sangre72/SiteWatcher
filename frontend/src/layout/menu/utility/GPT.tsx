import React, { useState, KeyboardEvent, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  CircularProgress,
  Dialog,
  DialogContent,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import axios from 'axios';
import AISidePanel from "../../right/AISidePanel";
import { atom, AtomOptions, RecoilState, useRecoilState } from "recoil";
import { gptDataState } from "../../../atom";
import { host_info } from "../../../HostInfo";

export interface TextAreaProps {
  fileText: string;
}

const fileTextData: AtomOptions<TextAreaProps> = {
  key: 'fileTextData',
  default: {
    fileText: ''
  },
};

export const fileTextState: RecoilState<TextAreaProps> = atom(fileTextData);

export const GPT: React.FC = () => {
  const [gptData] = useRecoilState(gptDataState);
  const [{ fileText }] = useRecoilState<TextAreaProps>(fileTextState);
  const [inputText, setInputText] = useState<string>('');
  const [responseContent, setResponseContent] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo-2024-04-09');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [, setCsrfTokenLLM] = useState('');

  useEffect(() => {
    setResponseContent(fileText);
  }, [fileText, inputText]);

  useEffect(() => {
    setInputText(gptData + " : 이 데이터에 어울리는 차트?");
  }, [gptData]);

  const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedModel(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);

    try {
      const qmElement = document.querySelector('input[name="qm"]:checked') as HTMLInputElement;
      const response = await axios.post(`${host_info}/gpt/message`, {
        message: inputText, threadId: threadId
      });
      setResponseContent(response.data.m);
      setIsOpen(true);
    } catch (error) {
      console.error('Error sending data:', error);
      setIsOpen(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    handleThread();
  }, []);

  const handleThread = async () => {
    if (threadId == null || threadId === "") {
      setIsLoading(true);
      try {
        const response = await axios.get(`${host_info}/gpt/thread`, {
          withCredentials: true
        });
        setThreadId(response.data.threadId);
      } catch (error) {
        alert("Thread 생성 실패.");
        console.error('Error sending data:', error);
      }
      setIsLoading(false);
    } else {
      console.log('We Have ThreadId:', threadId);
    }
  };

  const fetchCsrfToken = async () => {
    try {
      const response = await axios.get('http://localhost:9999/get-csrf-token');
      setCsrfTokenLLM(response.data.csrf_token);
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  };

  const handleGMNSend = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:9999/api/gmn-message', {
        q: inputText
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      setResponseContent(response.data.m);
      setIsOpen(true);
    } catch (error) {
      console.error('Error sending data:', error);
      setIsOpen(true);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const togglePanel = () => {
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Box>
      <TextField
        multiline
        rows={4}
        value={inputText}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        fullWidth
        disabled={isLoading}
        variant="outlined"
        size="small"
      />
      <Box sx={{ width: '100%', mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          variant="contained"
          color="success"
          onClick={handleThread}
          sx={{ width: 90 }}
        >
          ThreadId
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleSend}
          sx={{ width: 90 }}
        >
          Send
        </Button>
      </Box>

      <Box sx={{ mt: 2, display: 'none' }}>
        <RadioGroup value={selectedModel} onChange={handleModelChange}>
          <FormControlLabel
            value="gpt-4o"
            control={<Radio name="qm" id="theme1" />}
            label="gpt-4o"
          />
          <FormControlLabel
            value="gpt-3.5-turbo"
            control={<Radio name="qm" id="theme2" />}
            label="gpt-3.5-turbo"
          />
        </RadioGroup>
      </Box>

      <Dialog open={isLoading} onClose={() => {}}>
        <DialogContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} />
          <span>Loading...</span>
        </DialogContent>
      </Dialog>

      <AISidePanel
        isOpen={isOpen}
        onClose={handleClose}
        onToggle={togglePanel}
        responseContent={responseContent}
      />
    </Box>
  );
};
