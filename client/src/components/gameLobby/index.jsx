import React, { useContext, useState, useRef } from 'react';
import './index.css';
import { SocketContext, GameContext } from '../../context';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import DialogActions from '@mui/material/DialogActions';
import EditRoundedIcon from '@mui/icons-material/EditRounded';

function GameLobby() {
  const socket = useContext(SocketContext);
  const [game, setGame] = useContext(GameContext);
  const [nameDialog, setNameDialog] = useState(false);
  const [nameText, setNameText] = useState('');

  const openNameDialog = () => {
    setNameDialog(true);
  };

  const closeNameDialog = () => {
    console.log('close');
    setNameDialog(false);
  };

  const updateName = () => {
    if (nameText.length > 0) {
      socket.emit("nameUpdate", nameText);
      setNameText("");
      closeNameDialog();
    }
  };

  return (
    <div className="game-lobby">
      <Dialog
        open={nameDialog}
        onClose={closeNameDialog}
        onKeyUp={(e) => {
          if (e.key === 'Enter') { updateName(); }
        }}
      >
        <DialogContent>
          <TextField
            inputRef={(input) => input?.focus()}
            value={nameText}
            onChange={e => setNameText(e.target.value)}
            placeholder={"Choose a new name..."}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNameDialog}>Cancel</Button>
          <Button onClick={updateName}>Update</Button>
        </DialogActions>
      </Dialog>

      <Paper className="game-lobby-inner" elevation={5}>
        <div className="flex items-center justify-between w-full">
          <span className="text-lg uppercase game-font">Game Lobby</span>
          <code>{game.gameId}</code>
        </div>
        <hr className="mb-3 w-full" />
        <div className="mb-4 game-lobby-inner-inner">
          <List className="game-lobby-list mr-0">
            {
              Object.values(game.players).map(p => {
                if (p.pid === socket.id) {
                  return (
                    <ListItem key={p.pid} secondaryAction={
                      <IconButton edge="end" onClick={openNameDialog}>
                        <EditRoundedIcon />
                      </IconButton>
                    }>
                      {
                        p.pid === game.host
                          ? <ListItemText primary={`${p.name} (host)`} />
                          : <ListItemText primary={p.name} />
                      }
                    </ListItem>
                  )
                } else {
                  return (
                    <ListItem key={p.pid}>
                      { // TODO make this DRY
                        p.pid === game.host
                          ? <ListItemText primary={`${p.name} (host)`} />
                          : <ListItemText primary={p.name} />
                      }
                    </ListItem>
                  )
                }
              })
            }
          </List>
        </div>

        {
          game.host === socket.id
            ? <Button
              variant="contained"
              onClick={() => socket.emit('startGame')}
            >
              Start Game
            </Button>
            : <p>Waiting for host to start the game</p>
        }
      </Paper>
    </div>
  )
}

export default GameLobby;