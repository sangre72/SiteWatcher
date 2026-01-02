import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ComputerIcon from '@mui/icons-material/Computer';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import PendingIcon from '@mui/icons-material/Pending';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Collapse,
  Grid,
  IconButton,
  Paper,
  Typography,
  alpha,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

import SystemDashboard from '../../components/system/SystemDashboard';
import { host_info } from '../../HostInfo';
import { useHost } from '../../HostProvider';
import SliderBubbleComponent from '../../motion/SliderBubbleComponent';
import SliderComponent from '../../motion/SliderComponent';
import Bar3D from './Bar3d';
import Hosts from './config/Hosts';
import HostsUsageChart from './HostsUsageChart';
import NetworkChart from './NetworkChart';

const Homepage: React.FC = () => {
  const { globalSelectedHost, setGlobalSelectedHost } = useHost();
  const [pingStatus, setPingStatus] = useState('stopped');
  const [wasStatus, setWasStatus] = useState('stopped');
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const fetchSshWasStatusData = async () => {
    if (globalSelectedHost) {
      try {
        const url = host_info + '/ssh-was-status';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'X-XSS-Protection': '1; mode=block',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            h: globalSelectedHost.hostname,
            p: globalSelectedHost.ssh_port,
            u: globalSelectedHost.username,
            w: globalSelectedHost.password,
            was: 'catalina',
            a: 'localhost',
            o: '8080',
          }),
        });

        if (!response.ok) {
          setPingStatus('stopped');
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        setWasStatus(data.result);
      } catch (error) {
        setPingStatus('stopped');
        console.error('Error fetching ping:', error);
      }
    }
  };

  const fetchSshPingData = async () => {
    try {
      const url = host_info + '/ssh-ping';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-XSS-Protection': '1; mode=block',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          h: globalSelectedHost?.hostname,
          p: globalSelectedHost?.ssh_port,
          u: globalSelectedHost?.username,
          w: globalSelectedHost?.password,
        }),
      });

      if (!response.ok) {
        setPingStatus('server stopped');
        throw new Error('Failed to fetch data');
      }
      setPingStatus('server running');
    } catch (error) {
      setPingStatus('server check');
      console.error('Error fetching ping:', error);
    }
  };

  useEffect(() => {
    if (globalSelectedHost) {
      fetchSshWasStatusData();
      fetchSshPingData();

      const intervalId = setInterval(fetchSshWasStatusData, 3000);
      const intervalId2 = setInterval(fetchSshPingData, 3000);

      return () => {
        clearInterval(intervalId);
        clearInterval(intervalId2);
      };
    }
  }, [globalSelectedHost]);

  const getStatusIcon = (status: string) => {
    if (status.includes('running')) {
      return <CheckCircleIcon sx={{ color: 'success.main' }} />;
    } else if (status.includes('stopped')) {
      return <ErrorIcon sx={{ color: 'error.main' }} />;
    }
    return <PendingIcon sx={{ color: 'warning.main' }} />;
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' => {
    if (status.includes('running')) return 'success';
    if (status.includes('stopped')) return 'error';
    return 'warning';
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Host Selection Card */}
      <Card
        sx={{
          mb: 3,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(
              theme.palette.primary.main,
              0.1
            )} 100%)`,
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <CardContent sx={{ pb: isExpanded ? 2 : '16px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ComputerIcon color="primary" sx={{ fontSize: 28 }} />
              <Typography variant="h6" fontWeight={600}>
                Host Configuration
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={getStatusIcon(pingStatus)}
                label={`Server: ${pingStatus}`}
                size="small"
                color={getStatusColor(pingStatus)}
                variant="outlined"
              />
              <Chip
                icon={getStatusIcon(wasStatus)}
                label={`WAS: ${wasStatus}`}
                size="small"
                color={getStatusColor(wasStatus)}
                variant="outlined"
              />
              <IconButton onClick={toggleExpand} size="small">
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Hosts
              globalSelectedHost={globalSelectedHost}
              setGlobalSelectedHost={setGlobalSelectedHost}
            />
          </Box>

          <Collapse in={isExpanded}>
            <Box sx={{ mt: 2 }}>
              {globalSelectedHost && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="caption" color="text.secondary">
                        Hostname
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {globalSelectedHost.hostname}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="caption" color="text.secondary">
                        SSH Port
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {globalSelectedHost.ssh_port}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="caption" color="text.secondary">
                        JMX Port
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {globalSelectedHost.jmx_port || 'N/A'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Charts Row 1 */}
      <Grid container spacing={6}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              avatar={<SpeedIcon color="primary" />}
              title="CPU Usage Monitor"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
            />
            <CardContent>
              <SliderComponent />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              avatar={<StorageIcon color="primary" />}
              title="Hosts Usage Overview"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
            />
            <CardContent>
              <HostsUsageChart />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 3, width: '100%' }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="3D Bar Chart"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
            />
            <CardContent>
              <Bar3D />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Bubble Analysis"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
            />
            <CardContent>
              <SliderBubbleComponent />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              avatar={<NetworkCheckIcon color="primary" />}
              title="Network Topology"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
            />
            <CardContent>
              <NetworkChart />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Dashboard */}
      <Card>
        <CardHeader
          avatar={<ComputerIcon color="primary" />}
          title="System Dashboard"
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
          subheader="Real-time system metrics and JMX monitoring"
        />
        <CardContent>
          <SystemDashboard
            globalSelectedHost={globalSelectedHost}
            setGlobalSelectedHost={setGlobalSelectedHost}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default Homepage;
