/*
    Ryan Schwarzkopf
    March 4, 2024
    Web Development

    Nine Men's Morris

    Key for the board:

    a     b     c
      d   e   f
        g h i
    j k l   m n o 
        p q r
      s   t   u
    v     w     x


    There are 3 move functions for a player: placing, moving, flying
    for each turn, display the players turn, and the phase type
    player functions are determined by pieces on the board and in reserve
    if there is pieces in reserve, player is in placing
    if no pieces in reserve and greater than 3 pieces on board, player is in moving
    if no pieces in reserve and exactly 3 pieces on board, player is in flying

    each moving function will have a special selector and placer function with rules:
    placing: piece is taken from reserve, can be placed on any open spot
    moving: piece can only be taken from board, and can only be placed on an adjacent, open spot
    flying: piece can only be taken from board, and can be placed on any open spot

    game-over means any player has no pieces in reserve and less than 3 pieces on board
*/

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const width = canvas.width = 1000;
const height = canvas.height = 900;
const radius = 33;

const adjacency_list = {
                        A: ['J', 'B'], B: ['A', 'E', 'C'], C: ['B', 'O'],
                        D: ['K', 'E'], E: ['H', 'D', 'B', 'F'], F: ['E', 'N'],
                        G: ['L', 'H'], H: ['G', 'E', 'I'], I: ['M', 'H'],
                        J: ['V', 'A', 'K'], K: ['S', 'J', 'D', 'L'], L: ['P', 'K', 'G'],
                        M: ['R', 'I', 'N'], N: ['U', 'M', 'F', 'O'], O: ['X', 'N', 'C'],
                        P: ['L', 'Q'], Q: ['T', 'P', 'R'], R: ['Q', 'M'],
                        S: ['K', 'T'], T: ['W', 'S', 'Q', 'U'], U: ['T', 'N'],
                        V: ['J', 'W'], W: ['V', 'T', 'X'], X: ['W', 'O']
                    };


const mills = [['A', 'B', 'C'], ['D', 'E', 'F'], ['G', 'H', 'I'], 
                ['J', 'K', 'L'], ['M', 'N', 'O'], ['P', 'Q', 'R'],
                ['S', 'T', 'U'], ['V', 'W', 'X'],
                ['A', 'J', 'V'], ['D', 'K', 'S'], ['G', 'L', 'P'],
                ['B', 'E', 'H'], ['Q', 'T', 'W'], ['I', 'M', 'R'],
                ['F', 'N', 'U'], ['C', 'O', 'X']
            ]

const locations = { 
                    A: [200, 100], B: [500, 100], C: [800, 100],
                    D: [300, 200], E: [500, 200], F: [700, 200],
                    G: [400, 300], H: [500, 300], I: [600, 300],
                    J: [200, 400], K: [300, 400], L: [400, 400],
                    M: [600, 400], N: [700, 400], O: [800, 400],
                    P: [400, 500], Q: [500, 500], R: [600, 500],
                    S: [300, 600], T: [500, 600], U: [700, 600],
                    V: [200, 700], W: [500, 700], X: [800, 700]
                };

// global variables represent the game state
// format: [pieces in reserve, pieces on board]
let player_pieces;
let turn;
let piece_selected;
let player_mill;
let handle_mill;
let removable;
let game_over;

// 0 means no piece. 1 means white piece. 2 means black piece
let board = {
                A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0, K: 0,
                L: 0, M: 0, N: 0, O: 0, P: 0, Q: 0, R: 0, S: 0, T: 0, U: 0, V: 0,
                W: 0, X: 0
            };

// for the board draw 3 concentric squares
// and draw vertical and horizantal lines through the squares
// draw boxes on left and write to hold pieces
// draw a box on the bottom for text
function draw_board() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 10;
    
    // bottom line for text
    ctx.beginPath();
    ctx.moveTo(0, height-100);
    ctx.lineTo(width, height-100);
    ctx.stroke();

    // vertical lines for the pieces
    // left
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(100, height-100);
    ctx.stroke();
    // right
    ctx.beginPath();
    ctx.moveTo(width-100, 0);
    ctx.lineTo(width-100, height-100);
    ctx.stroke();

    ctx.lineWidth = 4;

    // middle crosshair
    // horizantal lines
    ctx.beginPath();
    ctx.moveTo(200, 400);
    ctx.lineTo(400, 400);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(600, 400);
    ctx.lineTo(800, 400);
    ctx.stroke();
    // vertical line
    ctx.beginPath();
    ctx.moveTo(500, 100);
    ctx.lineTo(500, 300);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(500, 500);
    ctx.lineTo(500, 700);
    ctx.stroke();

    // make 3 squares
    ctx.rect(200, 100, 600, 600);
    ctx.stroke();
    ctx.rect(300, 200, 400, 400);
    ctx.stroke();
    ctx.rect(400, 300, 200, 200);
    ctx.stroke();

    draw_reserve();
    draw_pieces(board);
    draw_turn();
}

// draw circles in reserve for white
function draw_reserve() {
    // white's reserve
    ctx.fillStyle = "white";
    for(let i = 0; i < player_pieces[0][0]; i++) {
        ctx.beginPath();
        ctx.arc(50, 733 - (2.5 * radius * (i)), radius, 0, Math.PI * 2, true);
        ctx.fill();
    }

    // black's reserve
    ctx.fillStyle = "black";
    for(let i = 0; i < player_pieces[1][0]; i++) {
        ctx.beginPath();
        ctx.arc(width - 50, 733 - (2.5 * radius * (i)), radius, 0, Math.PI * 2, true);
        ctx.fill();
    }
}

// draw pieces on the board
function draw_pieces(board) {
    for(key in board) {
        if(board[key] == 1) {
            ctx.fillStyle = "white";
            if(key == piece_selected) ctx.fillStyle = "grey";
            ctx.beginPath();
            ctx.arc(locations[key][0], locations[key][1], radius, 0, Math.PI * 2, true);
            ctx.fill();
        } else if(board[key] == 2) {
            ctx.fillStyle = "black";
            if(key == piece_selected) ctx.fillStyle = "grey";
            ctx.beginPath();
            ctx.arc(locations[key][0], locations[key][1], radius, 0, Math.PI * 2, true);
            ctx.fill();
        }
    }
}

function draw_turn() {
    ctx.font = "80px Copperplate, Papyrus, fantasy";
    ctx.fillStyle = "black";
    if(game_over == true) {
        ctx.fillText("GAME OVER", 250, 875);
    } else {
        if(turn == 0) ctx.fillText("White's turn", 225, 875);
        else ctx.fillText("Black's turn", 225, 875);
    }
}

// top of this function gets credit to geeksforgeeks
// https://www.geeksforgeeks.org/how-to-get-the-coordinates-of-a-mouse-click-on-a-canvas-element/
// this is used to calculate the x and y position inside the canvas independent of window size.
// calculates the euclidean distance to every point, and 
// calculates and returns the key on the board corresponding to the index of locations
function item_clicked(e) {
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // check if an index was clicked and what piece was in that position
    for(const key in locations) {
        // euclidean distance
        let distance = Math.sqrt( 
                            Math.pow(x - locations[key][0], 2) + 
                            Math.pow(y - locations[key][1], 2));
        if(distance <= radius * 1.5) {
            return key;
        }
    } // end for
    return -1;
}

// player has set a piece, check for a mill.
function check_mill(player_val) {
    let found = false;
    for(let i = 0; i < mills.length; i++) {
        if(board[mills[i][0]] == player_val
        && board[mills[i][1]] == player_val
        && board[mills[i][2]] == player_val) {
            if(player_mill[turn].length == 0 || !player_mill[turn].includes(i)) {
                player_mill[turn].push(i);
                handle_mill = turn;
                for(let j = 0; j < mills[i].length; j++) {
                    removable[turn] = removable[turn].filter(_ => _ !== mills[i][j]);
                }
                found = true;
            }
        }
    }
    return found;
}

function placing(item) {
    if (board[item] == 0) {
        board[item] = turn+1;
        player_pieces[turn][1] += 1;
        player_pieces[turn][0] -= 1;
        if(!removable[turn].includes(item)) removable[turn].push(item);
        if(!check_mill(turn+1)) swap_turns();
        draw_board();
        // turn+1 = player val on board
    }
}

// in moving, check if there is an open space for a the player to move to
// if there are no open spaces, return 0 and gameover = true
function playable() {
    for(const key in board) {
        if(board[key] == turn+1) {
            for(let i = 0; i < adjacency_list[key].length; i++) {
                if(board[adjacency_list[key][i]] == 0) return true;
            }
        }
    }
    return false;
}

function moveable(index) {
    for(let i = 0; i < adjacency_list[index].length; i++) {
        if(board[adjacency_list[index][i]] == 0) return true;
    }
    return false;
}

function move(item, movetype) {
    if(piece_selected == -1 || board[item] == turn+1) {
        if(board[item] == turn+1 && (moveable(item) || movetype == "flying")) {
            piece_selected = item;
            draw_board();
        }
    } else {
        if(board[item] == 0 && board[piece_selected] == turn+1 && (movetype == "flying" || (movetype == "moving" && adjacency_list[piece_selected].includes(item)))) {
            board[piece_selected] = 0;
            board[item] = turn+1;
            if(removable[turn].includes(piece_selected)) {
                // the piece was not in a mill
                removable[turn] = removable[turn].filter(_ => _ !== piece_selected);
                removable[turn].push(item);
            } else {
                // the piece was in a mill
                for(let i = 0; i < player_mill[turn].length; i++) {
                    if(mills[player_mill[turn][i]].includes(piece_selected)) {
                        const temp1 = mills[player_mill[turn][i]].length;
                        const temp2 = player_mill[turn][i];
                        for(let j = 0; j < temp1; j++) {
                            removable[turn].push(mills[temp2][j]);
                            player_mill[turn] = player_mill[turn].filter(_ => _ !== player_mill[turn][i]);
                        }
                    }
                }
            }        
            piece_selected = -1;
            if(!check_mill(turn+1)) swap_turns();
            draw_board();
        }
    }
}

function swap_turns() {
    if(turn == 1) {
        turn = 0;
    } else if(turn == 0){
        turn = 1;
    } else {
        console.log('TURN ERROR: should not be here');
    }
}

function remove_piece(player, piece) {
    if(removable[player].length == 0) {
        swap_turns();
        handle_mill = -1;
        return;
    }
    if(removable[player].includes(piece)) {
        board[piece] = 0;
        removable[player] = removable[player].filter(_ => _ !== piece);
        player_pieces[player][1] -= 1;
        if(player_pieces[player][1] < 3) game_over = true;
        swap_turns();
        draw_board();
        handle_mill = -1;
    }
}

function start_game() {
    // format: [pieces in reserve, pieces on board]
    turn = 0; // whites turn
    player_pieces = [[9, 0], [9, 0]];
    player_mill = [[], []];
    piece_selected = -1;
    handle_mill = -1;
    removable = [[], []];
    game_over = false;

    draw_board();

    canvas.onmouseup = (e) => {
        const item = item_clicked(e);
        if(item == -1) return
        if(handle_mill == 0) {
            remove_piece(1, item);      
        } else if(handle_mill == 1) {
            remove_piece(0, item);
        } else if(player_pieces[turn][0] > 0) {
            placing(item);
        } else if(player_pieces[turn][1] > 3) {
            if(!playable()) {
                game_over = true;
                return;
            }
            move(item, "moving");
        } else if(player_pieces[turn][1] == 3) {
            move(item, "flying");
        } else if(player_pieces[turn][1] < 3) {
            game_over = true;
            draw_board();
        } else {
            // should not be here
            console.log('ERROR: should never be here')
        }
    }
}

window.onload = () => {
    start_game();
};