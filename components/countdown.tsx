"use client";

import React, { useEffect, useState } from "react";
import Countdown from "react-countdown";

// Set countdown date dynamically or future date
const targetDate = new Date();
targetDate.setDate(targetDate.getDate() + 5);

const CountDown = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span className="font-bold text-5xl text-yellow-300">
        0d 00h 00m 00s
      </span>
    );
  }

  return (
    <Countdown
      date={targetDate}
      renderer={({ days, hours, minutes, seconds, completed }) =>
        completed ? (
          <span>Time's up!</span>
        ) : (
          <span className="font-bold text-5xl text-yellow-300">
            {days}d {hours}h {minutes}m {seconds}s
          </span>
        )
      }
    />
  );
};

export default CountDown;