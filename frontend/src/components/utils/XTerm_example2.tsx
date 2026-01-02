/*
import React from 'react';
import Terminal from 'react-console-emulator';

const MyTerminal = () => {
    const commands = {
        echo: {
            description: 'Echoes input text',
            usage: 'echo <text>',
            fn: function() {
                return `${Array.from(arguments).join(' ')}`
            }
        }
    }

    return (
        <div>
            <Terminal
                commands={commands}
                welcomeMessage={'Welcome to the React terminal! Type "help" for a list of commands.'}
                promptLabel={'user@host:~$'}
                style={{
                    flex: 1,
                    minHeight: '200px',
                    maxHeight: '50vh',
                }}
            />
        </div>
    );
}

export default MyTerminal;
*/
