import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

const CountdownTimer = ({ initialTime = 25 * 60 }) => {
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    setTime(initialTime);
  }, [initialTime]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime((prevTime) => Math.max(prevTime - 1, 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const formatTime = () => {
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = (time % 60).toString().padStart(2, '0');

    return `${minutes}:${seconds}`;
  };

  return (
    <div className="text-center">
      <h3 className="text-3xl font-semibold">Time</h3>
      <h5 className={`text-xl font-semibold ${time < 60 ? 'text-red-600 animate-pulse' : ''}`}>{formatTime()}</h5>
    </div>
  );
};

CountdownTimer.propTypes = {
  initialTime: PropTypes.number,
};

export default CountdownTimer;
