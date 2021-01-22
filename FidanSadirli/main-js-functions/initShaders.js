//
//  initShaders.js
//

function initShaders( gl, vertexShaderId, fragmentShaderId )
{
    let vertShdr;
    let fragShdr;

    let vertElem = document.getElementById( vertexShaderId );
    if ( !vertElem ) { 
        alert( "Could not load vertex shader " + vertexShaderId );
        return -1;
    }
    else {
        vertShdr = gl.createShader( gl.VERTEX_SHADER );
        gl.shaderSource( vertShdr, vertElem.text );
        gl.compileShader( vertShdr );
        if ( !gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS) ) {
            let msg = "Vertex shader could not compile.  The error log is:"
        	+ "<pre>" + gl.getShaderInfoLog( vertShdr ) + "</pre>";
            alert(msg);
            return -1;
        }
    }

    let fragElem = document.getElementById( fragmentShaderId );
    if (!fragElem) {
        alert( "Could not load vertex shader " + fragmentShaderId );
        return -1;
    }
    else {
        fragShdr = gl.createShader( gl.FRAGMENT_SHADER );
        gl.shaderSource( fragShdr, fragElem.text );
        gl.compileShader( fragShdr );
        if ( !gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS) ) {
            let msg = "Fragment shader could not compile.  The error log is:"
        	+ "<pre>" + gl.getShaderInfoLog( fragShdr ) + "</pre>";
            alert(msg);
            return -1;
        }
    }

    let program = gl.createProgram();
    gl.attachShader(program, vertShdr);
    gl.attachShader(program, fragShdr);
    gl.linkProgram(program);
    
    if ( !gl.getProgramParameter(program, gl.LINK_STATUS) ) {
        let msg = "Shader program could not link.  The error log is:"
            + "<pre>" + gl.getProgramInfoLog( program ) + "</pre>";
        alert(msg);
        return -1;
    }

    return program;
}
