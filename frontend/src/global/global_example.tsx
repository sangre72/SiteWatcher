import React from 'react';
import { useGlobal } from './global_variable'; // Path to your GlobalProvider

const MyComponent = () => {
    const { globalData, setGlobalData } = useGlobal();

    return (
        <div>
            <p>{globalData}</p>
            <button onClick={() => setGlobalData("Updated Data")}>
                Update Global Data
            </button>
        </div>
    );
};

export default MyComponent;