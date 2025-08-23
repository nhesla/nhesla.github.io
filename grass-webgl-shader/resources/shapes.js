// Taken from https://github.com/nickdesaulniers/prims

// Derived from: http://jacksondunstan.com/articles/1924
function Cone () {
  var sides = 20;
  var height = 1.0;
  var stepTheta = 2 * Math.PI / sides;
  var verticesPerCap = 9 * sides;

  var vertices = [];
  var theta = 0;
  var i = 0;

  // Bottom Cap
  theta = 0;
  for (; i < verticesPerCap; i += 9) {
    vertices[i    ] = Math.cos(theta);
    vertices[i + 1] = -height;
    vertices[i + 2] = Math.sin(theta);
    theta -= stepTheta;

    vertices[i + 3] = 0.0;
    vertices[i + 4] = -height;
    vertices[i + 5] = 0.0;

    vertices[i + 6] = Math.cos(theta);
    vertices[i + 7] = -height;
    vertices[i + 8] = Math.sin(theta);
  }

  for (var j = 0; j < sides; ++j) {
    // Bottom Right
    for (var k = 0; k < 3; ++k, ++i) {
      vertices[i] = vertices[0 + k + 9 * j];
    }

    // Bottom Left
    for (var k = 0; k < 3; ++k, ++i) {
      vertices[i] = vertices[6 + k + 9 * j];
    }

    // Top
    vertices[i++] = 0.0;
    vertices[i++] = height;
    vertices[i++] = 0.0;
  }

  var indices = new Array(vertices.length / 3);
  for (i = 0; i < indices.length; ++i) indices[i] = i;

  function sub (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; };
  function cross (a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  };
  function normalize (a) {
    var length = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
    return [a[0] / length, a[1] / length, a[2] / length];
  };

  var normals = [];

  for (var i = 0; i < vertices.length; i += 9) {
    var a = [vertices[i    ], vertices[i + 1], vertices[i + 2]];
    var b = [vertices[i + 3], vertices[i + 4], vertices[i + 5]];
    var c = [vertices[i + 6], vertices[i + 7], vertices[i + 8]]
    var normal = normalize(cross(sub(a, b), sub(a, c)));
    normals = normals.concat(normal, normal, normal);
  }

  return {
    vertices: vertices,
    indices: indices,
    normals: normals,
  };
};

function Cube () {
  var vertices = [
    // x,    y,    z
    // front face (z: +1)
     1.0,  1.0,  1.0, // top right
    -1.0,  1.0,  1.0, // top left
    -1.0, -1.0,  1.0, // bottom left
     1.0, -1.0,  1.0, // bottom right
    // right face (x: +1)
     1.0,  1.0, -1.0, // top right
     1.0,  1.0,  1.0, // top left
     1.0, -1.0,  1.0, // bottom left
     1.0, -1.0, -1.0, // bottom right
    // top face (y: +1)
     1.0,  1.0, -1.0, // top right
    -1.0,  1.0, -1.0, // top left
    -1.0,  1.0,  1.0, // bottom left
     1.0,  1.0,  1.0, // bottom right
    // left face (x: -1)
    -1.0,  1.0,  1.0, // top right
    -1.0,  1.0, -1.0, // top left
    -1.0, -1.0, -1.0, // bottom left
    -1.0, -1.0,  1.0, // bottom right
    // bottom face (y: -1)
     1.0, -1.0,  1.0, // top right
    -1.0, -1.0,  1.0, // top left
    -1.0, -1.0, -1.0, // bottom left
     1.0, -1.0, -1.0, // bottom right
    // back face (z: -1)
    -1.0,  1.0, -1.0, // top right
     1.0,  1.0, -1.0, // top left
     1.0, -1.0, -1.0, // bottom left
    -1.0, -1.0, -1.0  // bottom right
  ];

  var normals = [
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,

    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,

    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,

    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,

    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,

    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0
  ];

  var textures = [
    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,

    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,

    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,

    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,

    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,

    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,
  ];

  var indices = [
     0,  1,  2,   0,  2,  3,
     4,  5,  6,   4,  6,  7,
     8,  9, 10,   8, 10, 11,
    12, 13, 14,  12, 14, 15,
    16, 17, 18,  16, 18, 19,
    20, 21, 22,  20, 22, 23
  ];

  return {
    vertices: vertices,
    normals: normals,
    textures: textures,
    indices: indices,
  };
};

// Derived from: http://jacksondunstan.com/articles/1924
function Cylinder () {
  var sides = 20;
  var height = 1.0;
  var stepTheta = 2 * Math.PI / sides;
  var verticesPerCap = 9 * sides;

  var vertices = [];
  var theta = 0;
  var i = 0;

  // Top Cap
  for (; i < verticesPerCap; i += 9) {
    vertices[i    ] = Math.cos(theta);
    vertices[i + 1] = height;
    vertices[i + 2] = Math.sin(theta);
    theta += stepTheta;

    vertices[i + 3] = 0.0;
    vertices[i + 4] = height;
    vertices[i + 5] = 0.0;

    vertices[i + 6] = Math.cos(theta);
    vertices[i + 7] = height;
    vertices[i + 8] = Math.sin(theta);
  }

  // Bottom Cap
  theta = 0;
  for (; i < verticesPerCap + verticesPerCap; i += 9) {
    vertices[i + 6] = Math.cos(theta);
    vertices[i + 7] = -height;
    vertices[i + 8] = Math.sin(theta);
    theta += stepTheta;

    vertices[i + 3] = 0.0;
    vertices[i + 4] = -height;
    vertices[i + 5] = 0.0;

    vertices[i    ] = Math.cos(theta);
    vertices[i + 1] = -height;
    vertices[i + 2] = Math.sin(theta);
  }

  for (var j = 0; j < sides; ++j) {
    for (var k = 0; k < 3; ++k, ++i) {
      vertices[i] = vertices[0 + k + 9 * j];
    }
    for (var k = 0; k < 3; ++k, ++i) {
      vertices[i] = vertices[6 + k + 9 * j];
    }
    for (var k = 0; k < 3; ++k, ++i) {
      vertices[i] = vertices[verticesPerCap + k + 9 * j];
    }

    for (var k = 0; k < 3; ++k, ++i) {
      vertices[i] = vertices[0 + k + 9 * j];
    }
    for (var k = 0; k < 3; ++k, ++i) {
      vertices[i] = vertices[verticesPerCap + k + 9 * j];
    }
    for (var k = 0; k < 3; ++k, ++i) {
      vertices[i] = vertices[verticesPerCap + 6 + k + 9 * j];
    }
  }


  var indices = new Array(vertices.length / 3);
  for (i = 0; i < indices.length; ++i) indices[i] = i;

  function sub (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; };
  function cross (a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  };
  function normalize (a) {
    var length = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
    return [a[0] / length, a[1] / length, a[2] / length];
  };

  var normals = [];

  for (var i = 0; i < vertices.length; i += 9) {
    var a = [vertices[i    ], vertices[i + 1], vertices[i + 2]];
    var b = [vertices[i + 3], vertices[i + 4], vertices[i + 5]];
    var c = [vertices[i + 6], vertices[i + 7], vertices[i + 8]]
    var normal = normalize(cross(sub(a, b), sub(a, c)));
    normals = normals.concat(normal, normal, normal);
  }

  return {
    vertices: vertices,
    indices: indices,
    normals: normals,
  };
};

function Icosahedron () {
  var phi = (1 + Math.sqrt(5)) / 2;
  var a = 1;
  var b = 1 / phi;

  var vertices = [
     0,  b, -a,  -b,  a,  0,   b,  a,  0,
    -b,  a,  0,   0,  b,  a,   b,  a,  0,
     0, -b,  a,   0,  b,  a,  -a,  0,  b,
     a,  0,  b,   0,  b,  a,   0, -b,  a,
     0, -b, -a,   0,  b, -a,   a,  0, -b,
    -a,  0, -b,   0,  b, -a,   0, -b, -a,
     b, -a,  0,   0, -b,  a,  -b, -a,  0,
    -b, -a,  0,   0, -b, -a,   b, -a,  0,
    -a,  0,  b,  -b,  a,  0,  -a,  0, -b,
    -a,  0, -b,  -b, -a,  0,  -a,  0,  b,
     a,  0, -b,   b,  a,  0,   a,  0,  b,
     a,  0,  b,   b, -a,  0,   a,  0, -b,
    -a,  0,  b,   0,  b,  a,  -b,  a,  0,
     b,  a,  0,   0,  b,  a,   a,  0,  b,
    -b,  a,  0,   0,  b, -a,  -a,  0, -b,
     a,  0, -b,   0,  b, -a,   b,  a,  0,
    -a,  0, -b,   0, -b, -a,  -b, -a,  0,
     b, -a,  0,   0, -b, -a,   a,  0, -b,
    -b, -a,  0,   0, -b,  a,  -a,  0,  b,
     a,  0,  b,   0, -b,  a,   b, -a,  0
  ];

  function sub (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; };
  function cross (a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  };
  function normalize (a) {
    var length = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
    return [a[0] / length, a[1] / length, a[2] / length];
  };

  var normals = [];
  for (var i = 0; i < vertices.length; i += 9) {
    var a = [vertices[i    ], vertices[i + 1], vertices[i + 2]];
    var b = [vertices[i + 3], vertices[i + 4], vertices[i + 5]];
    var c = [vertices[i + 6], vertices[i + 7], vertices[i + 8]];
    // Normalizing is probably not necessary.
    // It should also be seperated out.
    var normal = normalize(cross(sub(a, b), sub(a, c)));
    normals = normals.concat(normal, normal, normal);
  }

  var indices = new Array(vertices.length / 3);

  for (var i = 0; i < indices.length; ++i) indices[i] = i;

  return {
    vertices: vertices,
    indices: indices,
    normals: normals,
  };
};

// http://learningwebgl.com/blog/?p=1253
function Sphere () {
  var vertices = [];
  var textures = [];
  var normals = [];
  var indices = [];

  var latitudeBands = 30;
  var longitudeBands = 30;
  var radius = 1.0;

  for (var latNumber = 0; latNumber <= latitudeBands; ++latNumber) {
    var theta = latNumber * Math.PI / latitudeBands;
    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);

    for (var longNumber = 0; longNumber <= longitudeBands; ++ longNumber) {
      var phi = longNumber * 2 * Math.PI / longitudeBands;
      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);

      var x = cosPhi * sinTheta;
      var y = cosTheta;
      var z = sinPhi * sinTheta;
      var u = 1 - longNumber / longitudeBands;
      var v = 1 - latNumber / latitudeBands;

      normals.push(x, y, z);
      textures.push(u, v);
      vertices.push(radius * x, radius * y, radius * z);
    }
  }

  for (latNumber = 0; latNumber < latitudeBands; ++latNumber) {
    for (longNumber = 0; longNumber < longitudeBands; ++ longNumber) {
      var first = latNumber * (longitudeBands + 1) + longNumber;
      var second = first + longitudeBands + 1;
      indices.push(second, first, first + 1, second + 1, second, first + 1);
    }
  }

  return {
    vertices: vertices,
    textures: textures,
    normals: normals,
    indices: indices,
  };
};

function Tetrahedron () {
  // http://paulbourke.net/geometry/platonic/
  var vertices = [
    -1,  1, -1,
     1,  1,  1,
     1, -1, -1,
    -1, -1,  1,
    -1,  1, -1,
     1, -1, -1,
     1, -1, -1,
     1,  1,  1,
    -1, -1,  1,
    -1, -1,  1,
     1,  1,  1,
    -1,  1, -1
  ];

  var indices = [
    0,  1,  2,
    3,  4,  5,
    6,  7,  8,
    9, 10, 11
  ];

  function sub (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; };
  function cross (a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  };
  function normalize (a) {
    var length = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
    return [a[0] / length, a[1] / length, a[2] / length];
  };

  var normals = [];

  for (var i = 0; i < vertices.length; i += 9) {
    var a = [vertices[i    ], vertices[i + 1], vertices[i + 2]];
    var b = [vertices[i + 3], vertices[i + 4], vertices[i + 5]];
    var c = [vertices[i + 6], vertices[i + 7], vertices[i + 8]];
    // Normalizing is probably not necessary.
    // It should also be seperated out.
    var normal = normalize(cross(sub(a, b), sub(a, c)));
    normals = normals.concat(normal, normal, normal);
  }

  return {
    vertices: vertices,
    indices: indices,
    normals: normals,
  };
};

function Torus () {
  var vertices = [];
  var indices = [];
  var normals = [];

  // https://code.google.com/p/min3d/source/browse/trunk/src/min3d/objectPrimitives/Torus.java?r=105
  var largeRadius = 1.0;
  var smallRadius = 0.4;
  var minWSegments = 30;
  var minHSegments = 30;

  var step1r = 2 * Math.PI / minWSegments;
  var step2r = 2 * Math.PI / minHSegments;

  var a1a = 0;
  var a1b = step1r;

  var vCount = 0;

  function getVertex (a1, r1, a2, r2) {
    var ca1 = Math.cos(a1);
    var ca2 = Math.cos(a2);
    var sa1 = Math.sin(a1);
    var sa2 = Math.sin(a2);
    var centerX = r1 * ca1;
    var centerZ = -r1 * sa1;
    var normalX = ca2 * ca1;
    var normalY = sa2;
    var normalZ = -ca2 * sa1;
    var x = centerX + r2 * normalX;
    var y = r2 * normalY;
    var z = centerZ + r2 * normalZ;

    normals.push(normalX, normalY, normalZ);
    vertices.push(x, y, z);
  };

  for (var s = 0; s < minWSegments; ++s, a1a = a1b, a1b += step1r) {
    var a2a = 0;
    var a2b = step2r;
    for (var s2 = 0; s2 < minHSegments; ++s2, a2a = a2b, a2b += step2r) {
      getVertex(a1a, largeRadius, a2a, smallRadius);
      getVertex(a1b, largeRadius, a2a, smallRadius);
      getVertex(a1b, largeRadius, a2b, smallRadius);
      getVertex(a1a, largeRadius, a2b, smallRadius);
      indices.push(vCount, vCount + 1, vCount + 2);
      indices.push(vCount, vCount + 2, vCount + 3);
      vCount += 4;
    }
  }
  return {
    vertices: vertices,
    indices: indices,
    normals: normals,
  };
};