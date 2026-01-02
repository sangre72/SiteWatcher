import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Paper,
  Chip,
  alpha,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { host_info } from "../../HostInfo";

interface HostsProps {
  hostname: string,
  ip_addr: string,
  http_port: string,
  https_port: string,
  ssh_port: string,
  username?: string,
  password?: string,
  os_status?: string,
  http_status?: string,
  was_status?: string
}

const Https_Management = () => {
  const [hosts, setHosts] = useState<HostsProps[]>([]);
  const [selectedHostIndex, setSelectedHostIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleRowClick = (index: number) => {
    setSelectedHostIndex(index);
  };

  const handleAddHost = () => {
    const newHost: HostsProps = {
      hostname: '',
      ip_addr: '',
      http_port: '',
      https_port: '',
      ssh_port: '',
      username: '',
      password: ''
    };
    setHosts([...hosts, newHost]);
  };

  const handleSubmit = async () => {
    try {
      await axios.post(host_info + '/add-update-http', { hosts });
    } catch (error) {
      console.error('Error submitting hosts:', error);
    }
  };

  const updateHostField = (index: number, field: keyof HostsProps, value: string) => {
    setHosts((currentHosts) =>
      currentHosts.map((host, i) =>
        i === index ? { ...host, [field]: value } : host
      )
    );

    if (field === 'ip_addr' || field === 'ssh_port' || field === 'http_port') {
      fetchPingData();
    }
  };

  useEffect(() => {
    const fetchHosts = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(host_info + '/https_information');
        if (response.data.length > 0)
          setHosts(response.data.hosts);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching hosts:', error);
        setIsLoading(false);
      }
    };
    fetchHosts();
  }, []);

  const fetchHttpInfo = async () => {
    for (const host of hosts) {
      try {
        if (host.http_port === "") return;
        const url = host_info + '/was-http-information';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'X-XSS-Protection': '1; mode=block',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ h: host.ip_addr, p: host.http_port })
        });
        const data = await response.json();
        const httpStatus = data.systemInfo && data.systemInfo.result === "success" ? "실행중" : "멈춤";

        setHosts((currentHosts) => currentHosts.map(h =>
          h.hostname === host.hostname ? { ...h, http_status: httpStatus } : h
        ));
      } catch (error) {
        console.error(`Error fetching additional info for ${host.hostname}:`, error);
      }
    }
  };

  const fetchPingData = async () => {
    for (const host of hosts) {
      if (host.ssh_port === "") return;
      try {
        const url = host_info + '/ssh-ping';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'X-XSS-Protection': '1; mode=block',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            h: host.ip_addr,
            p: host.ssh_port,
            u: host.username,
            w: host.password,
          })
        });
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        const osStatus = data && data.result === "success" ? "실행중" : "멈춤";

        setHosts((currentHosts) => currentHosts.map(h =>
          h.hostname === host.hostname ? { ...h, os_status: osStatus } : h
        ));
      } catch (error) {
        console.error('Error fetching ping:', error);
      }
    }
  };

  useEffect(() => {
    if (hosts.length > 0) {
      if (isLoading) {
        fetchPingData();
        setIsLoading(false);
      }
      const intervalOs = setInterval(fetchPingData, 5000);
      return () => {
        clearInterval(intervalOs);
      };
    }
  }, [hosts]);

  const getStatusChip = (status: string | undefined) => {
    const isRunning = status === "실행중";
    return (
      <Chip
        icon={isRunning ? <CheckCircleIcon /> : <ErrorIcon />}
        label={status || '멈춤'}
        size="small"
        color={isRunning ? 'success' : 'error'}
        variant="filled"
        sx={{ minWidth: 70 }}
      />
    );
  };

  if (isLoading) {
    return <Box sx={{ p: 2 }}>Loading hosts...</Box>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Button variant="contained" onClick={handleAddHost} sx={{ mb: 2 }}>
        Add Host
      </Button>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'success.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Hostname</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>IP Address</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>http Port</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>https Port</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>SSH Port</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Username</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Password</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>OS Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>http Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>WAS Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hosts.map((host, index) => (
              <TableRow
                key={index}
                onClick={() => handleRowClick(index)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: selectedHostIndex === index
                    ? (theme) => alpha(theme.palette.primary.main, 0.1)
                    : index % 2 === 0 ? 'grey.50' : 'inherit',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <TableCell>
                  <TextField size="small" value={host.hostname}
                    onChange={(e) => updateHostField(index, 'hostname', e.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField size="small" value={host.ip_addr}
                    onChange={(e) => updateHostField(index, 'ip_addr', e.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField size="small" defaultValue={host.http_port}
                    onChange={(e) => updateHostField(index, 'http_port', e.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField size="small" defaultValue={host.https_port}
                    onChange={(e) => updateHostField(index, 'https_port', e.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField size="small" defaultValue={host.ssh_port}
                    onChange={(e) => updateHostField(index, 'ssh_port', e.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField size="small" defaultValue={host.username}
                    onChange={(e) => updateHostField(index, 'username', e.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField size="small" type="password" defaultValue={host.password}
                    onChange={(e) => updateHostField(index, 'password', e.target.value)} />
                </TableCell>
                <TableCell>{getStatusChip(host.os_status)}</TableCell>
                <TableCell>{getStatusChip(host.http_status)}</TableCell>
                <TableCell>{getStatusChip(host.was_status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
        Submit
      </Button>
    </Box>
  );
};

export default Https_Management;
