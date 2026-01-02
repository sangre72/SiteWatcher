#!/bin/bash

# 호스트 목록
HOSTS=("host1" "host2" "host3")

# 사용자 입력 받기
read -p "Enter the source file path: " source_file
read -p "Enter the target directory: " target_dir

# 소스 파일 존재 여부 확인
if [ ! -f "$source_file" ]; then
    echo "Error: Source file does not exist."
    exit 1
fi

# 파일을 각 호스트의 대상 디렉토리로 복사
for HOST in "${HOSTS[@]}"; do
    # 대상 디렉토리 존재 여부 확인 (원격 호스트에서)
    if ssh "tomcat@$HOST" "[ ! -d '$target_dir' ]"; then
        echo "Error: Target directory does not exist on $HOST."
        continue  # 다음 호스트로 넘어간다
    fi

    # 파일 복사 실행
    scp "$source_file" "tomcat@$HOST:$target_dir" && \
    echo "File has been copied successfully to $HOST:$target_dir" || \
    echo "Failed to copy file to $HOST:$target_dir"
done
