var Loop = {
  numRows: 5,
  numCols: 5,
  size: { cell: 80, edge: 16 },
  button: { left: 2, top: 7 },
  font: {
    button: { size: 21 },
    display: { size: 19 }
  },
  color: {
    cell: '#fff',
    count: { have: '#888' },
    corner: { background: '#f2f6fa' },
    edge: {
      inactive: '#d6e2e5',
      active: {
        invalid: '#612929',
        looped: '#444',
        solved: '#396b3f'
      }
    }
  }
};

function makeUnselectable(element) {
  element.className += ' unselectable';
  element.ondragstart = element.onselectstart = function (event) {
    event.preventDefault();
  };
}
function getOffset(element, ancestor) {
  var left = 0,
      top = 0;
  while (element != ancestor) {
    left += element.offsetLeft;
    top += element.offsetTop;
    element = element.parentNode;
  }
  return { left: left, top: top };
}
function getMousePosition(event) {
  if (event.pageX) {
    return { x: event.pageX, y: event.pageY };
  }
  return {
    x: event.clientX + document.body.scrollLeft +
        document.documentElement.scrollLeft,
    y: event.clientY + document.body.scrollTop +
        document.documentElement.scrollTop
  };
}
function getPositionInPuzzle(event) {
  var position = getMousePosition(event);
  return { x: position.x - Loop.offset.left, y: position.y - Loop.offset.top };
}

function toggleEdge(r, c, dir) {
  // Toggle logical state and update count of each touching cell.
  var edge = Loop.edges[r][c][dir];
  edge.active = !edge.active;
  var increment = (edge.active ? 1 : -1);
  for (var i = 0; i < edge.touches.length; ++i) {
    var r = edge.touches[i].r,
        c = edge.touches[i].c,
        count = Loop.counts[r][c];
    count.have += increment;
    showCounts(r, c);
  }
  repaintGrid();
}

function repaintGrid() {
  // Compute each corner's degree.
  var looped = true,
      twoCount = 0,
      twoR = -1,
      twoC = -1;
  for (var r = 0; r <= Loop.numRows; ++r) {
    for (var c = 0; c <= Loop.numCols; ++c) {
      var corner = Loop.corners[r][c],
          degree = 0,
          dirs = corner.dirs = {};
      for (var dir = 0; dir < 4; ++dir) {
        if (corner[dir]) {
          var edge = corner[dir].edge;
          if (edge !== undefined && edge.active) {
            ++degree;
            dirs[dir] = true;
          }
        }
      }
      if (degree == 2) {
        ++twoCount;
        twoR = r;
        twoC = c;
      } else if (degree != 0) {
        looped = false;
      }
      corner.degree = degree;
      corner.visited = false;
    }
  }
  // Explore graph to determine edge color.
  if (looped && twoCount != 0) {
    var count = 0,
        r = twoR,
        c = twoC;
    while (true) {
      var corner = Loop.corners[r][c];
      corner.visited = true;
      ++count;
      for (var dir = 0; dir < 4; ++dir) {
        var info = corner[dir];
        if (info === undefined || !info.edge.active) {
          continue;
        }
        var neighbor = Loop.corners[info.r][info.c];
        if (!neighbor.visited) {
          break;
        }
      }
      if (dir == 4) {
        break;
      }
      r = info.r;
      c = info.c;
    }
    if (count != twoCount) {
      looped = false;
    }
  }
  // Check all constraints.
  var satisfied = true;
  for (var r = 0; satisfied && r < Loop.numRows; ++r) {
    var counts = Loop.counts[r];
    for (var c = 0; c < Loop.numCols; ++c) {
      var need = counts[c].need;
      if (need != -1 && counts[c].have != need) {
        satisfied = false;
        break;
      }
    }
  }
  var inactiveColor = Loop.color.edge.inactive,
      activeColors = Loop.color.edge.active,
      edgeColor = activeColors.invalid;
  if (looped) {
    edgeColor = (satisfied ? activeColors.solved : activeColors.looped);
  }
  // Repaint edges.
  var context = Loop.context,
      cellSize = Loop.size.cell,
      dd = Loop.size.edge,
      allEdges = Loop.allEdges;
  for (var i = 0; i < allEdges.length; ++i) {
    var edge = allEdges[i], r = edge.r, c = edge.c, dir = edge.dir;
    context.fillStyle = (edge.active ? edgeColor : inactiveColor);
    if (dir == 0 || dir == 2) {
      var x = dd + c * (cellSize + dd),
          y = (dir == 0 ? r : r + 1) * (dd + cellSize),
          dx = cellSize,
          dy = dd;
    } else {
      var x = (dir == 3 ? c : c + 1) * (dd + cellSize),
          y = dd + r * (cellSize + dd),
          dx = dd,
          dy = cellSize;
    }
    context.fillRect(x, y, dx, dy);
  }
  // Repaint corners.
  context.strokeStyle = edgeColor;
  context.lineWidth = dd;
  for (var r = 0; r <= Loop.numRows; ++r) {
    for (var c = 0; c <= Loop.numCols; ++c) {
      var corner = Loop.corners[r][c],
          degree = corner.degree,
          dirs = corner.dirs,
          x = c * (dd + cellSize),
          y = r * (dd + cellSize);
      context.fillStyle = inactiveColor;
      context.fillRect(x, y, dd, dd);
      if (degree < 2) {
        continue;
      }
      if (degree == 2 && ((dirs[0] && dirs[2]) || (dirs[1] && dirs[3]))) {
        context.fillStyle = edgeColor;
        context.fillRect(x, y, dd, dd);
        continue;
      }
      if (dirs[0] && dirs[1]) {
        context.beginPath();
        context.arc(x + dd, y, dd / 2, Math.PI / 2, Math.PI);
        context.stroke();
      }
      if (dirs[1] && dirs[2]) {
        context.beginPath();
        context.arc(x + dd, y + dd, dd / 2, Math.PI, 3 * Math.PI / 2);
        context.stroke();
      }
      if (dirs[2] && dirs[3]) {
        context.beginPath();
        context.arc(x, y + dd, dd / 2, 3 * Math.PI / 2, 2 * Math.PI);
        context.stroke();
      }
      if (dirs[3] && dirs[0]) {
        context.beginPath();
        context.arc(x, y, dd / 2, 0, Math.PI / 2);
        context.stroke();
      }
    }
  }
}

function showCounts(r, c) {
  var have = Loop.counts[r][c].have,
      haveDisplay = Loop.controls[r][c].display.have;
  haveDisplay.innerHTML = (have == 0 ? '' : '' + have);
  var need = Loop.counts[r][c].need,
      needDisplay = Loop.controls[r][c].display.need;
  needDisplay.innerHTML = (need == -1 ? '' : '' + need);  // &#9632
  var className = 'display';
  if (need != -1) {
    className += ' ' + (have == need ? 'correct' : 'incorrect');
  }
  haveDisplay.className = needDisplay.className = className;
}

function loadPuzzle() {
  var numRows = Loop.numRows,
      numCols = Loop.numCols;
  // Logical grid.
  var edges = Loop.edges = new Array(numRows),
      allEdges = Loop.allEdges = [],
      counts = Loop.counts = new Array(numRows),
      corners = Loop.corners = new Array(numRows + 1);
  for (var r = 0; r < numRows; ++r) {
    edges[r] = new Array(numCols);
    counts[r] = new Array(numCols);
    for (var c = 0; c < numCols; ++c) {
      counts[r][c] = { have: 0, need: -1 };
      var cell = edges[r][c] = new Array(4);
      // Horizontal edges.
      if (r == 0) {
        allEdges.push(cell[0] = {
          r: r, c: c, dir: 0,
          touches: [ { r: r, c: c } ], active: false
        });
      } else {
        cell[0] = edges[r - 1][c][2];
      }
      allEdges.push(cell[2] = {
        r: r, c: c, dir: 2,
        touches: [ { r: r, c: c } ], active: false
      });
      if (r != numRows - 1) {
        cell[2].touches.push({ r: r + 1, c: c });
      }
      // Vertical edges.
      if (c == 0) {
        allEdges.push(cell[3] = {
          r: r, c: c, dir: 3,
          touches: [ { r: r, c: c } ], active: false
        });
      } else {
        cell[3] = edges[r][c - 1][1];
      }
      allEdges.push(cell[1] = {
        r: r, c: c, dir: 1,
        touches: [ { r: r, c: c } ], active: false
      });
      if (c != numCols - 1) {
        cell[1].touches.push({ r: r, c: c + 1 });
      }
    }
  }
  // Corner connectivity.
  for (var r = 0; r <= numRows; ++r) {
    corners[r] = new Array(numCols + 1);
    for (var c = 0; c <= numCols; ++c) {
      var corner = corners[r][c] = {};
      if (r != 0) {
        corner[0] = { r: r - 1, c: c,
          edge: (c == 0 ? edges[r - 1][c][3] : edges[r - 1][c - 1][1])
        };
      }
      if (r != numRows) {
        corner[2] = { r: r + 1, c: c,
          edge: (c == 0 ? edges[r][c][3] : edges[r][c - 1][1])
        };
      }
      if (c != 0) {
        corner[3] = { r: r, c: c - 1,
          edge: (r == 0 ? edges[r][c - 1][0] : edges[r - 1][c - 1][2])
        };
      }
      if (c != numCols) {
        corner[1] = { r: r, c: c + 1,
          edge: (r == 0 ? edges[r][c][0] : edges[r - 1][c][2])
        };
      }
    }
  }
  // Physical grid.
  var container = document.getElementById('puzzle'),
      canvas = Loop.canvas = container.getElementsByTagName('canvas')[0],
      context = Loop.context = canvas.getContext('2d'),
      cellSize = Loop.size.cell,
      edgeSize = Loop.size.edge,
      width = canvas.width = edgeSize + numCols * (cellSize + edgeSize),
      height = canvas.height = edgeSize + numRows * (cellSize + edgeSize),
      offset = Loop.offset = getOffset(canvas, document.body);
  makeUnselectable(container);
  context.fillStyle = Loop.color.edge.inactive;
  context.fillRect(0, 0, width, height);
  context.fillStyle = Loop.color.cell;
  var controls = Loop.controls = new Array(numRows);
  function makePane() {
    var pane = document.createElement('div');
    pane.className = 'pane';
    pane.style.width = cellSize + 'px';
    pane.style.height = cellSize / 2 + 'px';
    return pane;
  }
  function makeDisplay() {
    var display = document.createElement('div');
    display.className = 'display';
    display.style.width = cellSize / 2 + 'px';
    display.style.height = cellSize / 2 + 'px';
    display.style.left = cellSize / 4 + 'px';
    display.style.top = '0';
    display.style.lineHeight = cellSize / 2 + 'px';
    display.style.fontSize = Loop.font.display.size + 'px';
    return display;
  }
  function addMouseHandlers(display) {
    var minusButton = display.buttons.minus,
        plusButton = display.buttons.plus,
        position = display.position,
        count = Loop.counts[position.r][position.c];
    minusButton.onmousedown = function () {
      if (--count.need == -1) {
        minusButton.style.visibility = 'hidden';
      }
      plusButton.style.visibility = 'visible';
      showCounts(position.r, position.c);
      repaintGrid();
    };
    plusButton.onmousedown = function () {
      if (++count.need == 4) {
        plusButton.style.visibility = 'hidden';
      }
      minusButton.style.visibility = 'visible';
      showCounts(position.r, position.c);
      repaintGrid();
    };
  }
  for (var r = 0; r < numRows; ++r) {
    controls[r] = new Array(numCols);
    for (var c = 0; c < numCols; ++c) {
      var x = edgeSize + r * (cellSize + edgeSize),
          y = edgeSize + c * (cellSize + edgeSize);
      context.fillRect(x, y, cellSize, cellSize);
      // Make constraint buttons.
      var needPane = makePane();
      needPane.className += ' need';
      needPane.style.left = edgeSize + c * (cellSize + edgeSize) + 'px';
      needPane.style.top = edgeSize + r * (cellSize + edgeSize) + 'px';
      var needDisplay = makeDisplay();
      needPane.appendChild(needDisplay);
      var minusButton = document.createElement('div'),
          plusButton = document.createElement('div');
      minusButton.className = plusButton.className = 'button';
      minusButton.innerHTML = '&minus;';
      minusButton.style.visibility = 'hidden';
      plusButton.innerHTML = '+';
      minusButton.style.left = Loop.button.left + 'px';
      minusButton.style.top = Loop.button.top + 'px';
      minusButton.style.fontSize = Loop.font.button.size + 'px';
      plusButton.style.right = Loop.button.left + 'px';
      plusButton.style.top = Loop.button.top + 'px';
      plusButton.style.fontSize = Loop.font.button.size + 'px';
      needPane.appendChild(minusButton);
      needPane.appendChild(plusButton);
      container.appendChild(needPane);
      needDisplay.buttons = { minus: minusButton, plus: plusButton,
          show: false };
      needDisplay.position = { r: r, c: c };
      addMouseHandlers(needDisplay);
      var havePane = makePane();
      havePane.className += ' have';
      havePane.style.left = edgeSize + c * (cellSize + edgeSize) + 'px';
      havePane.style.top = edgeSize + cellSize / 2 +
          r * (cellSize + edgeSize) + 'px';
      var haveDisplay = makeDisplay();
      havePane.appendChild(haveDisplay);
      container.appendChild(havePane);
      controls[r][c] = {
        display: { need: needDisplay, have: haveDisplay },
        button: { plus: plusButton, minus: minusButton }
      };
    }
  }
  function handleEdgeEvent(event, edgeTask) {
    var position = getPositionInPuzzle(event || window.event),
        fullX = position.x,
        fullY = position.y,
        x = fullX % (edgeSize + cellSize),
        y = fullY % (edgeSize + cellSize),
        r = Math.floor(fullY / (edgeSize + cellSize)),
        c = Math.floor(fullX / (edgeSize + cellSize));
    if (x >= edgeSize) {  // horizontal edge
      if (y < edgeSize) {
        if (r < numRows) {
          edgeTask(r, c, 0);
        } else {
          edgeTask(r - 1, c, 2);
        }
      }
    } else if (y >= edgeSize) {  // vertical edge
      if (x < edgeSize) {
        if (c < numCols) {
          edgeTask(r, c, 3);
        } else {
          edgeTask(r, c - 1, 1);
        }
      }
    } else {  // corner
    }
  }
  canvas.onmousedown = function (event) {
    handleEdgeEvent(event, toggleEdge);
  };
};

window.onload = function () {
  loadPuzzle();
};
