function multiplyMatrices(matrixA, matrixB) {
    var result = [];

    for (var i = 0; i < 4; i++) {
        result[i] = [];
        for (var j = 0; j < 4; j++) {
            var sum = 0;
            for (var k = 0; k < 4; k++) {
                sum += matrixA[i * 4 + k] * matrixB[k * 4 + j];
            }
            result[i][j] = sum;
        }
    }

    // Flatten the result array
    return result.reduce((a, b) => a.concat(b), []);
}
function createIdentityMatrix() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}
function createScaleMatrix(scale_x, scale_y, scale_z) {
    return new Float32Array([
        scale_x, 0, 0, 0,
        0, scale_y, 0, 0,
        0, 0, scale_z, 0,
        0, 0, 0, 1
    ]);
}

function createTranslationMatrix(x_amount, y_amount, z_amount) {
    return new Float32Array([
        1, 0, 0, x_amount,
        0, 1, 0, y_amount,
        0, 0, 1, z_amount,
        0, 0, 0, 1
    ]);
}

function createRotationMatrix_Z(radian) {
    return new Float32Array([
        Math.cos(radian), -Math.sin(radian), 0, 0,
        Math.sin(radian), Math.cos(radian), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_X(radian) {
    return new Float32Array([
        1, 0, 0, 0,
        0, Math.cos(radian), -Math.sin(radian), 0,
        0, Math.sin(radian), Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_Y(radian) {
    return new Float32Array([
        Math.cos(radian), 0, Math.sin(radian), 0,
        0, 1, 0, 0,
        -Math.sin(radian), 0, Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function getTransposeMatrix(matrix) {
    return new Float32Array([
        matrix[0], matrix[4], matrix[8], matrix[12],
        matrix[1], matrix[5], matrix[9], matrix[13],
        matrix[2], matrix[6], matrix[10], matrix[14],
        matrix[3], matrix[7], matrix[11], matrix[15]
    ]);
}

const vertexShaderSource = `
attribute vec3 position;
attribute vec3 normal; // Normal vector for lighting

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

uniform vec3 lightDirection;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vNormal = vec3(normalMatrix * vec4(normal, 0.0));
    vLightDirection = lightDirection;

    gl_Position = vec4(position, 1.0) * projectionMatrix * modelViewMatrix; 
}

`

const fragmentShaderSource = `
precision mediump float;

uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float shininess;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vLightDirection);
    
    // Ambient component
    vec3 ambient = ambientColor;

    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * diffuseColor;

    // Specular component (view-dependent)
    vec3 viewDir = vec3(0.0, 0.0, 1.0); // Assuming the view direction is along the z-axis
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = spec * specularColor;

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}

`

/**
 * @WARNING DO NOT CHANGE ANYTHING ABOVE THIS LINE
 */



/**
 * 
 * @TASK1 Calculate the model view matrix by using the chatGPT
 */

function getChatGPTModelViewMatrix() {
    const transformationMatrix = new Float32Array([
        0.17677669, -0.28661165,  0.73919892,  0.12468592,
        0.30618623,  0.36959946,  0.28033009, -0.0005439996,
        -0.35355338,  0.17677669,  0.61237246, -0.1502602,
        0.0,         0.0,         0.0,         1.0
    ]);
    
    return getTransposeMatrix(transformationMatrix);
}


/**
 * 
 * @TASK2 Calculate the model view matrix by using the given 
 * transformation methods and required transformation parameters
 * stated in transformation-prompt.txt
 */
function getModelViewMatrix() {

    var identityMatrix = createIdentityMatrix();
    var translationMatrix = createTranslationMatrix(0.3, -0.25, 0);
    var scalingMatrix = createScaleMatrix(0.5, 0.5, 1);

    var rotationMatrix_x = createRotationMatrix_X(Math.PI / 6);
    var rotationMatrix_y = createRotationMatrix_Y(Math.PI / 4);
    var rotationMatrix_z = createRotationMatrix_Z(Math.PI / 3);

    var transformationMatrix = identityMatrix; 
    transformationMatrix = multiplyMatrices(transformationMatrix, scalingMatrix);
    transformationMatrix = multiplyMatrices(transformationMatrix, rotationMatrix_x);
    transformationMatrix = multiplyMatrices(transformationMatrix, rotationMatrix_y);
    transformationMatrix = multiplyMatrices(transformationMatrix, rotationMatrix_z);
    transformationMatrix = multiplyMatrices(transformationMatrix, translationMatrix);

    console.log(transformationMatrix);
    return transformationMatrix
}

/**
 * 
 * @TASK3 Ask CHAT-GPT to animate the transformation calculated in 
 * task2 infinitely with a period of 10 seconds. 
 * First 5 seconds, the cube should transform from its initial 
 * position to the target position.
 * The next 5 seconds, the cube should return to its initial position.
 */
function getPeriodicMovement(startTime) {
    // Calculate the elapsed time since the animation started
    const elapsed = ((Date.now() - startTime) % 10000); // 10000 ms = 10 seconds
 
    // Calculate normalized progress within the 10-second period
    const normalizedProgress = (elapsed % 10000) / 10000;
 
    // Adjust progress for the animation
    const progress = normalizedProgress < 0.5 ? normalizedProgress * 2 : (1 - normalizedProgress) * 2;
 
    // Get the model view matrix
    const modelViewMatrix = getModelViewMatrix();
 
    // Interpolate between the identity and model view matrices based on progress
    const animatedMatrix = interpolateMatrices(
        createIdentityMatrix(), // Start with the identity matrix
        modelViewMatrix,
        progress
    );
        
    return animatedMatrix;
 }
 
 // Helper function to interpolate between two matrices
 function interpolateMatrices(matrix1, matrix2, progress) {
    const result = new Float32Array(16);
 
    for (let i = 0; i < 16; i++) {
        result[i] = matrix1[i] + (matrix2[i] - matrix1[i]) * progress;
    }
 
    return result;
 }