import React, { useContext, useState, useEffect, useRef } from 'react';
import './index.css';
import { SocketContext } from '../../context';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import DialogActions from '@mui/material/DialogActions';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select from '@mui/material/Select';

function MainLobby() {
  const socket = useContext(SocketContext);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [nameErr, setNameErr] = useState({ err: false, msg: '' });
  const [codeErr, setCodeErr] = useState({ err: false, msg: '' });
  const [nrounds, setNrounds] = useState(5)
  const [nbots, setNbots] = useState(0)
  const [showScores, setShowScores] = useState(true)

  const MAX_NAME_LENGTH = 12;
  const MAX_CODE_LENGTH = 12;

  useEffect(() => {
    if (!socket) return;

    socket.on("gameUnavailable", () => {
      setCodeErr({ err: true, msg: "This Game Code is Unavailable!" })
      setCreateDialog(false)
    });
    socket.on("gameAlreadyStarted", () => {
      setCodeErr({ err: true, msg: "This Game Has Already Started!" })
      setCreateDialog(false)
    });
    socket.on("nameUnavailable", () => {
      setNameErr({ err: true, msg: "This Name is Unavailable!" })
      setCreateDialog(false)
    });

  }, [socket]);

  const validateInput = () => {
    let err = 0;
    if (!name.length) {
      setNameErr({ err: true, msg: 'Name is required!' });
      err = 1;
    } else if (name.length > MAX_NAME_LENGTH) {
      setNameErr({ err: true, msg: `Name must be less then ${MAX_NAME_LENGTH + 1} characters` });
      err = 1;
    } else {
      setNameErr({ err: false, msg: '' });
    }

    if (!code.length) {
      setCodeErr({ err: true, msg: 'Game Code is required!' });
      err = 1;
    } else if (code.length > MAX_CODE_LENGTH) {
      setCodeErr({ err: true, msg: `Code must be less than ${MAX_CODE_LENGTH + 1} characters` });
      err = 1;
    } else {
      setCodeErr({ err: false, msg: '' });
    }

    return err;
  }

  const createGame = () => {
    if (validateInput()) return;
    socket.emit("createGame", {
      gameId: code,
      name: name,
      nrounds: nrounds,
      nbots: nbots,
      showScores: showScores
    });
  }

  const joinGame = () => {
    if (validateInput()) return;
    socket.emit("joinGame", { gameId: code, name: name });
  }

  return (
    <div className='lobby img-background'>
      <Paper elevation={5} className='lobby-menu'>
        <h1 className="uppercase text-4xl">INCAN GOLD</h1>
        <div className="lobby-menu-form mt-5">
          <TextField
            className="text-2xl mt-3"
            error={nameErr.err} helperText={nameErr.msg}
            label="Name" autoComplete="off" fullWidth
            onChange={(e) => setName(e.target.value)}
          />
          <div style={{ "color": "#f4f4f4" }}>.</div>
          <TextField
            className="text-2xl mt-3"
            error={codeErr.err} helperText={codeErr.msg}
            label="Game Code" autoComplete="off" fullWidth
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <div className="lobby-menu-buttons mt-5">
          <Button onClick={() => {
            if (validateInput()) return;
            setCreateDialog(true)
          }} size="large" variant="contained">
            Create
          </Button>
          <Button onClick={joinGame} size="large" variant="contained">
            Join
          </Button>
        </div>
      </Paper>

      <Dialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
      >
        <DialogTitle>Game Settings (<code>{code}</code>)</DialogTitle>
        <DialogContent>
          <Box
            noValidate
            component="form"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              m: 'auto',
              padding: '1rem 3rem'
            }}
          >
            <FormControl sx={{ mt: 2, minWidth: 120 }}>
              <InputLabel htmlFor="nrounds">Number of Rounds</InputLabel>
              <Select
                label="Number of Rounds"
                value={nrounds}
                inputProps={{
                  name: 'nrounds',
                  id: 'nrounds',
                }}
                onChange={e => setNrounds(e.target.value)}
              >
                <MenuItem value="3">3</MenuItem>
                <MenuItem value="4">4</MenuItem>
                <MenuItem value="5">5</MenuItem>
                <MenuItem value="6">6</MenuItem>
                <MenuItem value="7">7</MenuItem>
                <MenuItem value="8">8</MenuItem>
                <MenuItem value="9">9</MenuItem>
                <MenuItem value="10">10</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ mt: 2, minWidth: 120 }}>
              <InputLabel htmlFor="nbots">Number of Bots</InputLabel>
              <Select
                label="Number of Bots"
                value={nbots}
                inputProps={{
                  name: 'nbots',
                  id: 'nbots',
                }}
                onChange={e => setNbots(e.target.value)}
              >
                <MenuItem value="0">0</MenuItem>
                <MenuItem value="1">1</MenuItem>
                <MenuItem value="2">2</MenuItem>
                <MenuItem value="3">3</MenuItem>
                <MenuItem value="4">4</MenuItem>
                <MenuItem value="5">5</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              sx={{ mt: 1 }}
              control={
                <Checkbox checked={showScores} onChange={e => setShowScores(e.target.checked)} />
              }
              label="Show Player Scores"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={createGame}>Create</Button>
        </DialogActions>
      </Dialog>

    </div>
  )
}

export default MainLobby;