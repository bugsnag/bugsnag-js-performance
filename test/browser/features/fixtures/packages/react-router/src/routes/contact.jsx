import React, { useEffect } from 'react'

export default function Contact() {
  useEffect(() => {
    document.title = 'Contact 1'
  }, [])

  return (
    <div id="contact">Contact</div>
  );
}