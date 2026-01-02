from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader

cache_dir = "/Users/bumsuklee/.cache"

# 모델 로드
model_id = 'sentence-transformers/all-MiniLM-L6-v2'
model = SentenceTransformer(model_id, cache_folder=cache_dir)

# 학습 데이터 준비 (예제 데이터)
train_examples = [
    InputExample(texts=['This is an SUV.', 'This is a sport utility vehicle.'], label=1.0),
    InputExample(texts=['This is a car.', 'This is an automobile.'], label=1.0),
    InputExample(texts=['This is an SUV.', 'This is a suv.'], label=0.0),
    InputExample(texts=['This is an suv.', 'This is a sport utility vehicle.'], label=1.0),
    InputExample(texts=['This is an suv.', 'This is a SUV.'], label=0.0)
    # 추가 데이터 추가
]

# DataLoader 준비
train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=8)

# 손실 함수 설정
train_loss = losses.CosineSimilarityLoss(model)

# 학습
model.fit(train_objectives=[(train_dataloader, train_loss)], epochs=5, warmup_steps=100)

# 학습된 모델 저장
model.save('output/sentence-transformers-all-MiniLM-L6-v2-finetuned')