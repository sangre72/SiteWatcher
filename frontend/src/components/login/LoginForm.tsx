import React, { useState, KeyboardEvent, ChangeEvent, FormEvent } from 'react';

interface LoginFormProps {
    onLogin: (username: string, password: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = event.target;
        if (name === 'username') setUsername(value);
        if (name === 'password') setPassword(value);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        onLogin(username, password);
    };

    const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === 'Enter') {
            handleSubmit(event as unknown as FormEvent<HTMLFormElement>);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Username:
                <input type="text" name="username" value={username} onChange={handleInputChange} onKeyPress={handleKeyPress} />
            </label>
            <label>
                Password:
                <input type="password" name="password" value={password} onChange={handleInputChange} onKeyPress={handleKeyPress} />
            </label>
            <button type="submit">Login</button>
        </form>
    );
}

export default LoginForm;
