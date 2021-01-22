

function _argumentsToArray( args )
{
    return [].concat.apply( [], Array.prototype.slice.apply(args) );
}



function radians( degrees ) {
    return degrees * Math.PI / 180.0;
}


//  Vector Functions


function vec2()
{
    let result = _argumentsToArray( arguments );

    switch ( result.length ) {
    case 0: result.push( 0.0 );
    break;
    case 1: result.push( 0.0 );
    break;
    }

    return result.splice( 0, 2 );
}

function vec3()
{
    let result = _argumentsToArray( arguments );

    switch ( result.length ) {
    case 0: result.push( 0.0 );
    break;
    case 1: result.push( 0.0 );
    break;
    case 2: result.push( 0.0 );
    break;
    }

    return result.splice( 0, 3 );
}

function vec4()
{
    let result = _argumentsToArray( arguments );
    switch ( result.length ) {
    case 0:
    case 1:
    case 2:
        result.push( 0.0 );
    case 3: result.push( 1.0 );
    }

    return result.splice( 0, 4 );
}


//  Matrix Functions

function mat4()
{
    let v = _argumentsToArray( arguments );

    let m = [];
    switch ( v.length ) {
    case 0:
        v[0] = 1;
    case 1:
        m = [
            vec4( v[0], 0.0,  0.0,   0.0 ),
            vec4( 0.0,  v[0], 0.0,   0.0 ),
            vec4( 0.0,  0.0,  v[0],  0.0 ),
            vec4( 0.0,  0.0,  0.0,  v[0] )
        ];
        break;

    default:
        m.push( vec4(v) );  v.splice( 0, 4 );
        m.push( vec4(v) );  v.splice( 0, 4 );
        m.push( vec4(v) );  v.splice( 0, 4 );
        m.push( vec4(v) );
        break;
    }

    m.matrix = true;

    return m;
}


//Math operations


function equal( u, v )
{
    if ( u.length !== v.length ) { return false; }

    if ( u.matrix && v.matrix ) {
        for ( let i = 0; i < u.length; ++i ) {
            if ( u[i].length !== v[i].length ) { return false; }
            for ( let j = 0; j < u[i].length; ++j ) {
                if ( u[i][j] !== v[i][j] ) { return false; }
            }
        }
    }
    else if ( u.matrix && !v.matrix || !u.matrix && v.matrix ) {
        return false;
    }
    else {
        for ( let i = 0; i < u.length; ++i ) {
            if ( u[i] !== v[i] ) { return false; }
        }
    }

    return true;
}


function add( u, v )
{
    let result = [];

    if ( u.matrix && v.matrix ) {
        if ( u.length !== v.length ) {
            throw "add(): trying to add matrices of different dimensions";
        }

        for ( let i = 0; i < u.length; ++i ) {
            if ( u[i].length !== v[i].length ) {
                throw "add(): trying to add matrices of different dimensions";
            }
            result.push( [] );
            for ( let j = 0; j < u[i].length; ++j ) {
                result[i].push( u[i][j] + v[i][j] );
            }
        }

        result.matrix = true;
        return result;
    }
    else if ( u.matrix && !v.matrix || !u.matrix && v.matrix ) {
        throw "add(): trying to add matrix and non-matrix variables";
    }
    else {
        if ( u.length !== v.length ) {
            throw "add(): vectors are not the same dimension";
        }

        for ( let i = 0; i < u.length; ++i ) {
            result.push( u[i] + v[i] );
        }
        return result;
    }
}


function subtract( u, v )
{
    let result = [];

    if ( u.matrix && v.matrix ) {
        if ( u.length !== v.length ) {
            throw "subtract(): trying to subtract matrices" +
                " of different dimensions";
        }

        for ( let i = 0; i < u.length; ++i ) {
            if ( u[i].length !== v[i].length ) {
                throw "subtract(): trying to subtact matrices" +
                    " of different dimensions";
            }
            result.push( [] );
            for ( let j = 0; j < u[i].length; ++j ) {
                result[i].push( u[i][j] - v[i][j] );
            }
        }

        result.matrix = true;

        return result;
    }
    else if ( u.matrix && !v.matrix || !u.matrix && v.matrix ) {
        throw "subtract(): trying to subtract  matrix and non-matrix variables";
    }
    else {
        if ( u.length !== v.length ) {
            throw "subtract(): vectors are not the same length";
        }

        for ( let i = 0; i < u.length; ++i ) {
            result.push( u[i] - v[i] );
        }

        return result;
    }
}

function translate( x, y, z )
{
    if ( Array.isArray(x) && x.length === 3 ) {
        z = x[2];
        y = x[1];
        x = x[0];
    }

    let result = mat4();
    result[0][3] = x;
    result[1][3] = y;
    result[2][3] = z;

    return result;
}

function lookAt( eye, at, up )
{
    if ( !Array.isArray(eye) || eye.length !== 3) {
        throw "lookAt(): first parameter [eye] must be an a vec3";
    }

    if ( !Array.isArray(at) || at.length !== 3) {
        throw "lookAt(): first parameter [at] must be an a vec3";
    }

    if ( !Array.isArray(up) || up.length !== 3) {
        throw "lookAt(): first parameter [up] must be an a vec3";
    }

    if ( equal(eye, at) ) {
        return mat4();
    }

    let v = normalize( subtract(at, eye) );  //view direction vector
    let n = normalize( cross(v, up) );       //perpendicular vector
    let u = normalize( cross(n, v) );

    v = negate( v );

    return mat4(
        vec4(n, -dot(n, eye)),
        vec4(u, -dot(u, eye)),
        vec4(v, -dot(v, eye)),
        vec4()
    );
}


function perspective( fovy, aspect, near, far )
{
    let f = 1.0 / Math.tan( radians(fovy) / 2 );
    let d = far - near;

    let result = mat4();
    result[0][0] = f / aspect;
    result[1][1] = f;
    result[2][2] = -(near + far) / d;
    result[2][3] = -2 * near * far / d;
    result[3][2] = -1;
    result[3][3] = 0.0;

    return result;
}


//  Matrix Functions


function transpose( m )
{
    if ( !m.matrix ) {
        return "transpose(): trying to transpose a non-matrix";
    }

    let result = [];
    for ( let i = 0; i < m.length; ++i ) {
        result.push( [] );
        for ( let j = 0; j < m[i].length; ++j ) {
            result[i].push( m[j][i] );
        }
    }

    result.matrix = true;

    return result;
}


//Vector Functions


function dot( u, v )
{
    if ( u.length !== v.length ) {
        throw "dot(): vectors are not the same dimension";
    }

    let sum = 0.0;
    for ( let i = 0; i < u.length; ++i ) {
        sum += u[i] * v[i];
    }

    return sum;
}


function negate( u )
{
    let result = [];
    u.forEach(item => {
        result.push(-item);
    })
    return result;
}


function cross( u, v )
{
    if ( !Array.isArray(u) || u.length < 3 ) {
        throw "cross(): first argument is not a vector of at least 3";
    }

    if ( !Array.isArray(v) || v.length < 3 ) {
        throw "cross(): second argument is not a vector of at least 3";
    }

    return [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0]
    ];
}


function length( u )
{
    return Math.sqrt( dot(u, u) );
}


function normalize( u, excludeLastComponent )
{
    let last;
    if ( excludeLastComponent ) {
        last = u.pop();
    }

    let len = length( u );

    if ( !isFinite(len) ) {
        throw "normalize: vector " + u + " has zero length";
    }

    for ( let i = 0; i < u.length; ++i ) {
        u[i] /= len;
    }


    if ( excludeLastComponent ) {
        u.push( last );
    }

    return u;
}


// Vector and Matrix functions


function flatten( v )
{
    if ( v.matrix === true ) {
        v = transpose( v );
    }

    let n = v.length;
    let elemsAreArrays = false;

    if ( Array.isArray(v[0]) ) {
        elemsAreArrays = true;
        n *= v[0].length;
    }

    let floats = new Float32Array( n );

    if ( elemsAreArrays ) {
        let idx = 0;
        for ( let i = 0; i < v.length; ++i ) {
            for ( let j = 0; j < v[i].length; ++j ) {
                floats[idx++] = v[i][j];
            }
        }
    }
    else {
        for ( let i = 0; i < v.length; ++i ) {
            floats[i] = v[i];
        }
    }

    return floats;
}
