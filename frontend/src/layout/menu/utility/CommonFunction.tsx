import axios from 'axios';
import {host_info} from '../../../HostInfo';
export const threadId = '';
export const fetchThreadId = async () => {
    try {
        const response = await axios.get({host_info} + `/gpt/thread`, {
            withCredentials: true
        });
        console.log('Thread ID fetched:', response.data.threadId);
        return response.data.threadId;  // 성공 시 thread ID 반환
    } catch (error) {
        console.error('Error fetching thread ID:', error);
        throw error;  // 오류를 호출자에게 전달
    }
};