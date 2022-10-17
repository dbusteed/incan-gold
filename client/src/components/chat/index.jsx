import { useContext, useState, useEffect, useRef } from "react";
import './index.css';
import { GameContext, SocketContext } from "../../context";
import Paper from "@mui/material/Paper";
import { IconButton, InputAdornment, OutlinedInput } from "@mui/material";
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';

function Chat(props) {
  const socket = useContext(SocketContext);
  const [game, setGame] = useContext(GameContext);
  const [chatInput, setChatInput] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const mobile = props.mobile;

  useEffect(() => {
    if (!socket) return;
    socket.on("gameUpdate", g => {
      setGame(g)
    });
  }, [socket]);

  const sendMessage = () => {
    if (chatInput.length > 0) {
      setChatInput('');
      socket.emit('chatMessage', chatInput);
    }
  }

  const ScollToMe = () => {
    const elementRef = useRef();
    useEffect(() => elementRef.current.scrollIntoView());
    return <li ref={elementRef} />;
  };

  return (
    <Paper
      className="chat"
      elevation={5}
      style={{ flex: collapsed ? "" : "1 0 0" }}
    >
      <div className="flex flex-row justify-between items-center">
        <span className="text-lg uppercase game-font">game chat</span>
        <IconButton style={{display: mobile ? "none" : "inline-flex"}} onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ExpandMoreRoundedIcon /> : <ExpandLessRoundedIcon />}
        </IconButton>
      </div>
      {
        !collapsed &&
        <>
          <hr className="mb-3" />
          <div className="chat-messages-container">
            <ul className="chat-messages">
              {
                game.msgs.map((m, idx) => (
                  <li key={idx}>
                    <span className="font-bold mr-1">{game.players[m[0]].name}:</span>{m[1]}
                  </li>
                ))
              }
              <ScollToMe />
            </ul>
          </div>
          <div className="chat-input">
            <OutlinedInput
              value={chatInput} className="bg-white"
              fullWidth label=""
              placeholder=""
              onChange={(e) => {
                setChatInput(e.target.value);
              }}
              onKeyUp={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton onClick={sendMessage}>
                    <SendRoundedIcon />
                  </IconButton>
                </InputAdornment>
              }
            />
          </div>
        </>
      }
    </Paper>
  );
}

export default Chat;