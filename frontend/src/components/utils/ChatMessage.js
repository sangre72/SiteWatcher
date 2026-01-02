import React from 'react';
import styled from 'styled-components';

// Styled-components 정의
const MessageContainer = styled.div`
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  background-color: ${props => props.isUser ? '#2b313e' : '#475063'};
  color: #fff;
`;

const Avatar = styled.div`
  width: 20%;
  img {
    max-width: 78px;
    max-height: 78px;
    border-radius: 50%;
    object-fit: cover;
  }
`;

const MessageText = styled.div`
  width: 80%;
  padding: 0 1.5rem;
`;

// ChatMessage 컴포넌트
const ChatMessage = ({ isUser, message }) => {
    return (
        <MessageContainer isUser={isUser}>
            <Avatar>
                <img src={isUser ? "https://i.ibb.co/rdZC7LZ/Photo-logo-1.png" : "https://i.ibb.co/cN0nmSj/Screenshot-2023-05-28-at-02-37-21.png"} />
            </Avatar>
            <MessageText>{message}</MessageText>
        </MessageContainer>
    );
};

export default ChatMessage;
