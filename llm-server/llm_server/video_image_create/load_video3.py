import os

import cv2
import numpy as np
import matplotlib.pyplot as plt

def detect_lines_and_walls(frame):
    # 차선 검출
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)

    # Hough 변환을 사용한 선 검출
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=50, minLineLength=100, maxLineGap=50)
    line_img = np.zeros_like(frame)
    if lines is not None:
        for line in lines:
            for x1, y1, x2, y2 in line:
                cv2.line(line_img, (x1, y1), (x2, y2), (0, 255, 0), 2)

    # 벽 검출 (색상 분할 예시)
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    lower_wall = np.array([0, 0, 50])
    upper_wall = np.array([179, 50, 255])
    mask_wall = cv2.inRange(hsv, lower_wall, upper_wall)
    wall_img = np.zeros_like(frame)
    wall_img[mask_wall > 0] = [255, 0, 0]  # 벽을 파란색으로 표시

    # 차선과 벽을 결합
    combined_img = cv2.addWeighted(frame, 0.8, line_img, 1, 0)
    #combined_img = cv2.addWeighted(combined_img, 0.8, wall_img, 1, 0)
    return combined_img

def display_video_with_detection(video_path):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print("Error: Could not open video.")
        return

    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    duration = frame_count / fps
    print(f"Total frames: {frame_count}, Duration: {duration:.2f} seconds")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        detected_frame = detect_lines_and_walls(frame)

        # OpenCV로 비디오 프레임을 디스플레이
        cv2.imshow('Frame with Lines and Walls', detected_frame)

        if cv2.waitKey(int(1000 / fps)) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
# 비디오 파일 경로
# 비디오 파일 절대 경로 설정
video_path = os.path.abspath('/Users/bumsuklee/PhpstormProjects/20240418-git-test-prototype-cms/llm-server/llm_server/video_image_create/tiny.mp4')

display_video_with_detection(video_path)
