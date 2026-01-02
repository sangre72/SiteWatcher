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
  ssh_port: string,
  jmx_port: string,
  was_directory: string,
  was_start_command: string,
  was_pid: string,
  database_port: string,
  username?: string,
  password?: string,
  os_status?: string,
  jmx_status?: string,
  was_status?: string
}

const Hosts_Management = () => {
  const [hosts, setHosts] = useState<HostsProps[]>([]);
  const [selectedHostIndex, setSelectedHostIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const updateHostField = (index: number, field: string, value: string) => {
    setHosts((currentHosts) =>
      currentHosts.map((host, i) =>
        i === index ? { ...host, [field]: value } : host
      )
    );
  };

  const handleRowClick = (index: number) => {
    setSelectedHostIndex(index);
  };

  const handleAddHost = () => {
    const newHost: HostsProps = {
      hostname: '',
      ip_addr: '',
      ssh_port: '',
      jmx_port: '',
      was_directory: '',
      was_start_command: '',
      was_pid: '',
      database_port: '',
      username: '',
      password: ''
    };
    setHosts([...hosts, newHost]);
  };

  const handleSubmit = async () => {
    try {
      await axios.post(host_info + '/add-update-host', { hosts });
    } catch (error) {
      console.error('Error submitting hosts:', error);
    }
  };

  useEffect(() => {
    const fetchHosts = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(host_info + '/hosts_information');
        setHosts(response.data.hosts);
        setIsLoading(true);
      } catch (error) {
        console.error('Error fetching hosts:', error);
        setIsLoading(false);
      }
    };
    fetchHosts();
  }, []);

  useEffect(() => {
    fetchWasInfo();
    fetchJmxInfo();
    fetchPingData();
    setIsLoading(false);
    const intervalWas = setInterval(fetchWasInfo, 2000);
    const intervalJmx = setInterval(fetchJmxInfo, 2000);
    const intervalOs = setInterval(fetchPingData, 2000);

    return () => {
      clearInterval(intervalWas);
      clearInterval(intervalJmx);
      clearInterval(intervalOs);
    };
  }, [isLoading]);

  const fetchPingData = async () => {
    for (const host of hosts) {
      if (host.ssh_port === "" || host.ssh_port.length === 1 || host.username === "" || host.password === "") return;
      try {
        const url = host_info + '/ssh-ping';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'X-XSS-Protection': '1; mode=block',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            h: host.hostname,
            p: host.ssh_port,
            u: host.username,
            w: host.password,
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        const osStatus = data && data.result === "success" ? "실행" : "멈춤";

        setHosts((currentHosts) =>
          currentHosts.map(h =>
            h.hostname === host.hostname ? { ...h, os_status: osStatus } : h
          )
        );
      } catch (error) {
        console.error('Error fetching ping:', error);
      }
    }
  };

  const fetchJmxInfo = async () => {
    for (const host of hosts) {
      if (host.jmx_port === "" || host.jmx_port.length === 1 || host.username === "" || host.password === "") return;
      try {
        if (host.jmx_port === "") return;
        const url = host_info + '/was-jmx-information';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'X-XSS-Protection': '1; mode=block',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ h: host.hostname, ip: host.ip_addr, p: host.jmx_port })
        });
        const data = await response.json();
        const jmxStatus = data.systemInfo && data.systemInfo.result === "success" ? "실행" : "멈춤";

        setHosts((currentHosts) => currentHosts.map(h =>
          h.hostname === host.hostname ? { ...h, jmx_status: jmxStatus } : h
        ));
      } catch (error) {
        console.error(`Error fetching additional info for ${host.hostname}:`, error);
      }
    }
  };

  const fetchWasInfo = async () => {
    for (const host of hosts) {
      if (host.ssh_port === "" || host.ssh_port.length === 1 || host.username === "" || host.password === "") return;
      try {
        const url = host_info + '/ssh-was-status';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'X-XSS-Protection': '1; mode=block',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            h: host.hostname,
            p: host.ssh_port,
            u: host.username,
            w: host.password,
            was: host.was_start_command,
            a: host.ip_addr,
            o: host.database_port
          })
        });
        const data = await response.json();

        setHosts((currentHosts) =>
          currentHosts.map(h =>
            h.hostname === host.hostname
              ? { ...h, was_pid: data.details, was_status: data.result ? "실행" : "멈춤" }
              : h
          )
        );
      } catch (error) {
        setHosts((currentHosts) =>
          currentHosts.map(h =>
            h.hostname === host.hostname
              ? { ...h, was_status: "멈춤" }
              : h
          )
        );
        console.error(`Error fetching WAS status for ${host.hostname}:`, error);
      }
    }
  };

  const getStatusChip = (status: string | undefined) => {
    const isRunning = status === "실행";
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
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>SSH</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>JMX</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Was Directory</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Run Command</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>PID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Service</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Username</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Password</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>OS</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Service</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>JMX</TableCell>
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
                  <TextField size="small" value={host.ip_addr} sx={{ width: 150 }}
                    onChange={(e) => updateHostField(index, 'ip_addr', e.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField size="small" value={host.ssh_port} sx={{ width: 50 }}
                    onChange={(e) => updateHostField(index, 'ssh_port', e.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField size="small" value={host.jmx_port} sx={{ width: 50 }}
                    onChange={(e) => updateHostField(index, 'jmx_port', e.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField size="small" value={host.was_directory} sx={{ width: 350 }}
                    onChange={(e) => updateHostField(index, 'was_directory', e.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField size="small" value={host.was_start_command}
                    onChange={(e) => updateHostField(index, 'was_start_command', e.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField size="small" value={host.was_pid} sx={{ width: 100 }}
                    onChange={(e) => updateHostField(index, 'was_pid', e.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField size="small" value={host.database_port} sx={{ width: 50 }}
                    onChange={(e) => updateHostField(index, 'database_port', e.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField size="small" value={host.username}
                    onChange={(e) => updateHostField(index, 'username', e.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField size="small" type="password" value={host.password}
                    onChange={(e) => updateHostField(index, 'password', e.target.value)} />
                </TableCell>
                <TableCell>{getStatusChip(host.os_status)}</TableCell>
                <TableCell>{getStatusChip(host.was_status)}</TableCell>
                <TableCell>{getStatusChip(host.jmx_status)}</TableCell>
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

export default Hosts_Management;
