// Get HTML elements
const canvas = document.getElementById('notepadCanvas');
const ctx = canvas.getContext('2d');
const coordinateInput = document.getElementById('coordinateInput');
const goToCoordinateButton = document.getElementById('goToCoordinate');
const addNoteButton = document.getElementById('addNoteButton');
const noteModal = document.getElementById('noteModal');
const noteContentInput = document.getElementById('noteContent');
const saveNoteButton = document.getElementById('saveNote');
const cancelNoteButton = document.getElementById('cancelNote');

// Canvas transformation variables
let offsetX = canvas.width / 2;
let offsetY = canvas.height / 2;
let scale = 1;

// Notes array
let notes = [];

// Load notes from session storage
function loadNotes() {
    const savedNotes = sessionStorage.getItem('notes');
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
    }
}

// Save notes to session storage
function saveNotes() {
    sessionStorage.setItem('notes', JSON.stringify(notes));
}

// Draw canvas content
function draw() {
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    ctx.clearRect(-offsetX / scale, -offsetY / scale, canvas.width / scale, canvas.height / scale);

    // Draw grid
    drawGrid();

    // Draw notes
    notes.forEach(note => {
        drawNote(note);
    });

    ctx.restore();
}

// Draw grid lines
function drawGrid() {
    const gridSize = 50;
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.5;

    for (let x = -offsetX / scale - canvas.width / (2 * scale); x < canvas.width / scale + offsetX / scale; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, -offsetY / scale - canvas.height / (2 * scale));
        ctx.lineTo(x, canvas.height / scale + offsetY / scale);
        ctx.stroke();
    }

    for (let y = -offsetY / scale - canvas.height / (2 * scale); y < canvas.height / scale + offsetY / scale; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-offsetX / scale - canvas.width / (2 * scale), y);
        ctx.lineTo(canvas.width / scale + offsetX / scale, y);
        ctx.stroke();
    }
}

// Draw a single note
function drawNote(note) {
    ctx.fillStyle = note.locked ? '#ccc' : '#ffeb3b';
    ctx.fillRect(note.x, note.y, 150, 100);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(note.x, note.y, 150, 100);
    ctx.fillStyle = '#000';
    ctx.font = '14px Arial';
    wrapText(ctx, note.content, note.x + 10, note.y + 20, 130, 16);
}

// Text wrapping function
function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        }
        else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}

// Coordinate transformation
function screenToWorld(x, y) {
    return {
        x: (x - offsetX) / scale,
        y: (y - offsetY) / scale
    };
}

// Pan and zoom functionality
let isDragging = false;
let lastX, lastY;

canvas.addEventListener('mousedown', function (e) {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener('mousemove', function (e) {
    if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        offsetX += dx;
        offsetY += dy;
        lastX = e.clientX;
        lastY = e.clientY;
        draw();
    }
});

canvas.addEventListener('mouseup', function () {
    isDragging = false;
});

canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    const mousePos = screenToWorld(e.clientX, e.clientY);
    const zoom = e.deltaY < 0 ? 1.1 : 0.9;
    scale *= zoom;
    offsetX -= (mousePos.x * zoom - mousePos.x) * scale;
    offsetY -= (mousePos.y * zoom - mousePos.y) * scale;
    draw();
});

// Add note functionality
let addingNote = false;
let newNotePosition = { x: 0, y: 0 };

addNoteButton.addEventListener('click', function () {
    addingNote = true;
    canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('click', function (e) {
    if (addingNote) {
        const pos = screenToWorld(e.clientX, e.clientY);
        newNotePosition = { x: pos.x, y: pos.y };
        openNoteModal();
        addingNote = false;
        canvas.style.cursor = 'default';
    } else {
        // Check if a note was clicked
        const pos = screenToWorld(e.clientX, e.clientY);
        const clickedNote = notes.find(note => pos.x >= note.x && pos.x <= note.x + 150 && pos.y >= note.y && pos.y <= note.y + 100);
        if (clickedNote) {
            if (!clickedNote.locked) {
                editNote(clickedNote);
            } else {
                alert('This note is locked.');
            }
        }
    }
});

// Note modal functions
function openNoteModal() {
    noteModal.style.display = 'flex';
    noteContentInput.value = '';
}

function closeNoteModal() {
    noteModal.style.display = 'none';
}

saveNoteButton.addEventListener('click', function () {
    const content = noteContentInput.value.trim();
    if (content) {
        notes.push({
            id: Date.now(),
            x: newNotePosition.x,
            y: newNotePosition.y,
            content: content,
            locked: false
        });
        saveNotes();
        draw();
    }
    closeNoteModal();
});

cancelNoteButton.addEventListener('click', function () {
    closeNoteModal();
});

// Edit note function
function editNote(note) {
    noteModal.style.display = 'flex';
    noteContentInput.value = note.content;

    saveNoteButton.onclick = function () {
        const content = noteContentInput.value.trim();
        if (content) {
            note.content = content;
            saveNotes();
            draw();
        }
        closeNoteModal();
        resetSaveButton();
    };

    cancelNoteButton.onclick = function () {
        closeNoteModal();
        resetSaveButton();
    };
}

// Reset save button event listener
function resetSaveButton() {
    saveNoteButton.onclick = function () {
        const content = noteContentInput.value.trim();
        if (content) {
            notes.push({
                id: Date.now(),
                x: newNotePosition.x,
                y: newNotePosition.y,
                content: content,
                locked: false
            });
            saveNotes();
            draw();
        }
        closeNoteModal();
    };
}

// Coordinate navigation
goToCoordinateButton.addEventListener('click', function () {
    const coords = coordinateInput.value.trim().split(',');
    if (coords.length === 2) {
        const x = parseFloat(coords[0]);
        const y = parseFloat(coords[1]);
        if (!isNaN(x) && !isNaN(y)) {
            offsetX = canvas.width / 2 - x * scale;
            offsetY = canvas.height / 2 - y * scale;
            draw();
        } else {
            alert('Invalid coordinates.');
        }
    } else {
        alert('Please enter coordinates in the format x,y');
    }
});

// Initialize
loadNotes();
draw();

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
    if (e.key === 'l') {
        // Toggle lock on selected note
        toggleLockOnNote();
    }
});

// Toggle lock function
function toggleLockOnNote() {
    // This function assumes you have a way to select a note.
    // For simplicity, let's toggle the lock on the last edited note.
    if (notes.length > 0) {
        const note = notes[notes.length - 1];
        note.locked = !note.locked;
        saveNotes();
        draw();
    }
}
