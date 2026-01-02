import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Box,
  alpha,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { host_info } from "../../../HostInfo";
import { useHost } from "../../../HostProvider";

interface HostsProps {
  hostname: string,
  ip_addr: string,
  jmx_port: string,
  ssh_port: string,
  database_port: string,
  was_directory: string,
  was_start_command: string,
  was_pid: string,
  username?: string,
  password?: string,
  os_status?: string,
  jmx_status?: string,
  was_status?: string
}

const Hosts: React.FC = () => {
  const { globalSelectedHost, setGlobalSelectedHost } = useHost();

  const [hosts, setHosts] = useState<HostsProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const handleRowClick = (index: number) => {
    setSelectedRowIndex(index);
    setGlobalSelectedHost(hosts[index]);
  };

  useEffect(() => {
    const fetchHosts = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(host_info + '/hosts_information');
        setHosts(response.data.hosts);
        await setGlobalSelectedHost(response.data.hosts[0]);
      } catch (error) {
        console.error('Error fetching hosts:', error);
        setIsLoading(false);
      }
    };
    fetchHosts();
  }, []);

  const fetchJmxInfo = async () => {
    for (const host of hosts) {
      if (host.jmx_port !== "" && host.jmx_port !== "undefined" && host.jmx_port !== null) {
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
          const jmxStatus = data.systemInfo && data.systemInfo.result === "success" ? "실행중" : "멈춤";
          setHosts((currentHosts) => currentHosts.map(h =>
            h.hostname === host.hostname ? { ...h, jmx_status: jmxStatus } : h
          ));
        } catch (error) {
          console.error(`Error fetching additional info for ${host.hostname}:`, error);
        }
      }
    }
  };

  const fetchPingData = async () => {
    for (const host of hosts) {
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
        const osStatus = data && data.result === "success" ? "실행중" : "멈춤";
        setHosts((currentHosts) => currentHosts.map(h =>
          h.hostname === host.hostname ? { ...h, os_status: osStatus } : h
        ));
      } catch (error) {
        console.error('Error fetching ping:', error);
      }
    }
  };

  const fetchWasInfo = async () => {
    for (const host of hosts) {
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
            was: 'catalina',
            a: 'localhost',
            o: '8080'
          })
        });
        const data = await response.json();
        setHosts((currentHosts) => currentHosts.map(h =>
          h.hostname === host.hostname ? { ...h, was_status: data.result ? "실행중" : "멈춤" } : h
        ));
      } catch (error) {
        setHosts((currentHosts) => currentHosts.map(h =>
          h.hostname === host.hostname ? { ...h, was_status: "멈춤" } : h
        ));
        console.error(`Error fetching WAS status for ${host.hostname}:`, error);
      }
    }
  };

  useEffect(() => {
    if (hosts.length > 0) {
      if (isLoading) {
        fetchPingData();
        fetchWasInfo();
        fetchJmxInfo();
        setIsLoading(false);
      }
      const intervalOs = setInterval(fetchPingData, 15000);
      const intervalWas = setInterval(fetchWasInfo, 15000);
      const intervalJmx = setInterval(fetchJmxInfo, 15000);

      return () => {
        clearInterval(intervalOs);
        clearInterval(intervalWas);
        clearInterval(intervalJmx);
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
        sx={{ minWidth: 80 }}
      />
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <TableContainer sx={{ width: '100%' }}>
      <Table size="small" sx={{ width: '100%' }}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'warning.light' }}>
            <TableCell sx={{ fontWeight: 600 }}>Host</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>IP</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Service Port</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>OS</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>WAS</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Service(JMX)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {hosts.map((h, index) => (
            <TableRow
              key={index}
              onClick={() => handleRowClick(index)}
              sx={{
                cursor: 'pointer',
                bgcolor: index === selectedRowIndex
                  ? (theme) => alpha(theme.palette.primary.main, 0.1)
                  : 'inherit',
                '&:hover': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              <TableCell>{h.hostname}</TableCell>
              <TableCell>{h.ip_addr}</TableCell>
              <TableCell>{h.jmx_port}</TableCell>
              <TableCell>{getStatusChip(h.os_status)}</TableCell>
              <TableCell>{getStatusChip(h.was_status)}</TableCell>
              <TableCell>{getStatusChip(h.jmx_status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default Hosts;
