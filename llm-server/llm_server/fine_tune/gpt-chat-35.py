import csv
import json
import os
import random

def split_data(filename, train_ratio=0.7):
    with open(filename, 'r') as file:
        reader = csv.reader(file)
        headers = next(reader)  # 첫 번째 행을 헤더로 읽음
        data_list = list(reader)  # 데이터를 리스트로 변환

    # 데이터를 섞음
    #random.shuffle(data_list)

    # 트레이닝 데이터와 검증 데이터로 분할
    split_index = int(len(data_list) * train_ratio)
    training_data = data_list[:split_index]
    validation_data = data_list[split_index:]

    return training_data, validation_data

def write_jsonl(data, output_filename):
    with open(output_filename, 'w') as outfile:
        for row in data:
            if len(row) >= 7:
                jsonl_entries = [
                    {"role": "user", "content": f"What is the low price of Apple (AAPL) on {row[0]}?"},
                    {"role": "assistant", "content": f"The low price is '{row[1]}.'"},
                    {"role": "user", "content": f"What is the open price of Apple (AAPL) on {row[0]}?"},
                    {"role": "assistant", "content": f"The open price is '{row[2]}.'"},
                    {"role": "user", "content": f"What is the volume for Apple (AAPL) on {row[0]}?"},
                    {"role": "assistant", "content": f"The volume is '{row[3]}.'"},
                    {"role": "user", "content": f"What is the high price of Apple (AAPL) on {row[0]}?"},
                    {"role": "assistant", "content": f"The high price is '{row[4]}.'"},
                    {"role": "user", "content": f"What is the close price of Apple (AAPL) on {row[0]}?"},
                    {"role": "assistant", "content": f"The close price is '{row[5]}.'"},
                    {"role": "user", "content": f"What is the adjusted close price of Apple (AAPL) on {row[0]}?"},
                    {"role": "assistant", "content": f"The adjusted close price is '{row[6]}.'"}
                ]
                dialog = {"messages": jsonl_entries}
                json.dump(dialog, outfile)
                outfile.write('\n')

if __name__ == '__main__':
    input_filename = os.path.join(os.getcwd(), 'AAPL100.csv')
    train_output = os.path.join(os.getcwd(), 'train_data3.jsonl')
    validation_output = os.path.join(os.getcwd(), 'validation_data3.jsonl')

    # 데이터 분할
    training_data, validation_data = split_data(input_filename)

    # JSONL 파일로 저장
    write_jsonl(training_data, train_output)
    write_jsonl(validation_data, validation_output)
    print("트레이닝 데이터와 검증 데이터 파일 생성 완료")
