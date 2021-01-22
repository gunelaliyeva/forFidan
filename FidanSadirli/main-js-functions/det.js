function changeSign(i, j){
    if ((i + j) % 2 === 0) {
    return 1;
    }
    else {
    return -1;
    }
}
//...........................................................................................
function minor(input, i, j)
{
    let len = parseInt(Math.sqrt(input.length).toString());
    let output = [];
    for (let ii = 0; ii< len; ii++) {
        output.push([]);
    }
    let x = 0, y = 0;
    for (let m = 0; m < len; m++, x++)
    {
        if (m !== i)
        {
            y = 0;
            for (let n = 0; n < len; n++)
            {
                if (n !== j)
                {
                    output[x][y] = input[m][n];
                    y++;
                }
            }

        }
        else
        {
            x--;
        }
    }
    return output;
}
//.......................................................................................................
function determinant(input)
{
    let len = parseInt(Math.sqrt(input.length).toString());
    if (len > 2)
    {
        let value = 0;
        for (let j = 0; j < len; j++)
        {
            let temp = minor(input, 0, j);
            value = value + input[0][j] * (changeSign(0, j) * determinant(temp));
        }
        return value;
    }
    else if (len === 2)
    {
        return ((input[0][0] * input[1][1]) - (input[1][0] * input[0][1]));
    }
    else
    {
        return (input[0][0]);
    }
}
