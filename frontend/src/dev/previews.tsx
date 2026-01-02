import {ComponentPreview, Previews} from "@react-buddy/ide-toolbox";
import {PaletteTree} from "./palette";
import App from "../App";
import React from "react";

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/App">
                <App/>
            </ComponentPreview>
        </Previews>
    );
};

export default ComponentPreviews;