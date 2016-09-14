import React, { PropTypes } from "react";

import { suppressEvent } from "../utils.js";

// onClick, href and className are optional.
function TextLink({
    onClick, href, text, className
}) {
    function click(e) {
        suppressEvent(e);
        if (onClick) onClick();
    }

    let classes = className || "";
    if (classes !== "") {
        classes += " ";
    }
    classes += "link";

    return (
        <a onClick={click} href={href || "#"}>
            {text}
        </a>
    );
}

TextLink.propTypes = {
    onClick: PropTypes.func,
    href: PropTypes.string,
    text: PropTypes.string.isRequired,
    className: PropTypes.string,
};

export default TextLink;
