#!/bin/bash

# top 명령어 출력
output=$(top -b -n 1 | head -n 20)

# 물리 메모리 정보
mem_info=$(free -m)
total_mem=$(echo "$mem_info" | grep Mem: | awk '{print $2 "MB"}')
used_mem=$(echo "$mem_info" | grep Mem: | awk '{print $3 "MB"}')
free_mem=$(echo "$mem_info" | grep Mem: | awk '{print $4 "MB"}')
shared_mem=$(echo "$mem_info" | grep Mem: | awk '{print $5 "MB"}')
buff_cache_mem=$(echo "$mem_info" | grep Mem: | awk '{print $6 "MB"}')
available_mem=$(echo "$mem_info" | grep Mem: | awk '{print $7 "MB"}')

# 네트워크 사용 정보
rx_bytes=$(ip -s link | awk '/RX:/{getline; total += $1} END{print total}')
tx_bytes=$(ip -s link | awk '/TX:/{getline; total += $1} END{print total}')

# 네트워크 패킷 정보
rx_packets=$(ip -s link | awk '/RX:/{getline; total += $2} END{print total}')
tx_packets=$(ip -s link | awk '/TX:/{getline; total += $2} END{print total}')

# 바이트를 사람이 읽을 수 있는 형식으로 변환하는 함수
convert_bytes() {
  local bytes=$1
  local kib=$((bytes / 1024))
  local mib=$((kib / 1024))
  local gib=$((mib / 1024))

  if [ $gib -gt 0 ]; then
    echo "${gib}G"
  elif [ $mib -gt 0 ]; then
    echo "${mib}M"
  elif [ $kib -gt 0 ]; then
    echo "${kib}K"
  else
    echo "${bytes}B"
  fi
}

rx_human=$(convert_bytes $rx_bytes)
tx_human=$(convert_bytes $tx_bytes)

# 디스크 사용 정보
disk_info=$(df -h --total | grep 'total')

# 출력 형식 조정
echo "Processes: $(echo "$output" | grep Tasks | awk '{print $2 " total, " $4 " running, " $6 " sleeping, " $8 " stopped, " $10 " zombie"}')"
echo "$(date '+%Y/%m/%d %H:%M:%S')"
echo "Load Avg: $(echo "$output" | grep "load average" | awk '{print $12 " " $13 " " $14}')"
echo "CPU usage: $(echo "$output" | grep "%Cpu(s)" | awk '{print $2 "% user, " $4 "% sys, " $8 "% idle"}')"
#echo "MemRegions: N/A"
echo "PhysMem: Total: $total_mem, Used: $used_mem, Free: $free_mem, Buff/Cache: $buff_cache_mem, Shared: $shared_mem, Available: $available_mem"
#echo "VM: N/A"
echo "Networks: packets: ${rx_packets}/${rx_human} in, ${tx_packets}/${tx_human} out"
echo "Disks: $(echo "$disk_info" | awk '{print $3 " used, " $4 " available"}')"

