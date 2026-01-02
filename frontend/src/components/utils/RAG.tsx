import React, {useEffect, useRef, useState} from 'react';
import './terminal.css'
import ChatMessage from "./ChatMessage";
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import {host_info} from "../../HostInfo";

// Register the plugins
registerPlugin(FilePondPluginImagePreview);

interface FilePondFile {
    file: File;
    filename: string;
    serverId?: string;
}
interface UploadedFile {
    name: string;
    serverId: string;
}

const RAG = () => {
    const [files, setFiles] = React.useState([]);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

    // 사용 예시
    const handleProcessFile = (error: any, file: FilePondFile) => {
        if (error) {
            console.error('Oh no, something went wrong', error);
        } else {
            const fileData = {
                name: file.filename,
                serverId: file.serverId || 'No server ID', // 서버 ID가 없는 경우 처리
            };
            setUploadedFiles(prevFiles => [...prevFiles, fileData]);
        }
    };

    return (
        <div style={{width: '100%', marginTop: '20px' }}>
            <table style={{ width: '100%', fontSize: '12px' }}>
                <thead style={{width: '100%'}}></thead>
                <tbody style={{width: '100%'}}>
                <tr>
                    <td style={{width: '300px', marginTop: '0', marginRight: '20px'}}>
                        <div style={{width: '300px', marginTop: '0', justifyContent: 'flex-start', marginRight: '20px'}}>
                            <FilePond
                                files={files}
                                allowMultiple={true}
                                onupdatefiles={setFiles}
                                allowImagePreview
                                imagePreviewMaxHeight={250}
                                acceptedFileTypes={['image/*', 'application/pdf']}
                                labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
                                server={{
                                    process: {
                                        url: host_info + '/upload',
                                        method: 'POST', // 대부분의 경우 'POST' 메소드 사용
                                        withCredentials: false,
                                        headers: {
                                            'Authorization': 'Bearer YOUR_TOKEN_HERE',
                                        },
                                        ondata: (formData) => {
                                            //formData.append('userName', 'JohnDoe'); // 필요한 추가 데이터
                                            return formData;
                                        },
                                        onload: (response: any) => JSON.parse(response),
                                        onerror: (response: any) => console.error('File upload error:', response.data),
                                    },

                                    revert: '/revert', // 파일을 서버에서 삭제할 URL
                                    load: '/load', // 파일을 로드할 URL
                                    restore: '/restore' // 파일을 복원할 URL
                                }}
                                onprocessfile={() => handleProcessFile}


                            />
                        </div>
                    </td>
                    <td>
                        <div style={{width: '70%', alignContent: 'center'}}>
                            <div style={{width: '100%'}}>
                                <ChatMessage isUser={true} message="Hello, this is a user message!"/>
                                <ChatMessage isUser={false} message="Hello, this is a bot response!"/>
                            </div>
                        </div>
                    </td>
                </tr>
                </tbody>
            </table>
            {/*<div style={{ width: '50%' }}>
                <ChatMessage isUser={true} message="Hello, this is a user message!" />
                <ChatMessage isUser={false} message="Hello, this is a bot response!" />
            </div>*/}
        </div>
    );
};


export default RAG;