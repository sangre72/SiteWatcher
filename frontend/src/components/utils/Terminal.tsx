import React, {useEffect, useRef, useState} from 'react';
import styled from 'styled-components';
import './terminal.css'

const Terminal = (props = {}) => {

    // Terminal has 100% width by default so it should usually be wrapped in a container div
    // ttyd -W -O -t titleFixed=helloWorld zsh
    return (
        <div>
            <style>
            {`
                #iFrameTerminal {
                    width: 100%;
                    height: 80vh;
                    border: none;
                }
            `}
            </style>
            <iframe id="iFrameTerminal" src="http://localhost:7681"></iframe>
        </div>
    );
};

export default Terminal;