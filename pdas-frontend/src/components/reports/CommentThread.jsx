import React, { useState, useEffect } from 'react';
import api from '../../services/api';

/**
 * Displays a thread of comments for a specific report and allows adding new ones.
 */
const CommentThread = ({ reportId }) => {
  const [comments, setComments] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetch comments on mount
  useEffect(() => {
    // api.get(`/reports/${reportId}/comments`).then(...)
  }, [reportId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // api.post(`/reports/${reportId}/comments`, { message: newMessage })
  };

  return (
    <div className="comment-thread">
      <h3>Investigation Notes</h3>
      <div className="comments-list">
        {comments.map(comment => (
          <div key={comment.comment_id} className="comment">
            <strong>{comment.author.full_name}</strong>
            <p>{comment.message}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <textarea 
          value={newMessage} 
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Add a comment..."
        />
        <button type="submit">Post</button>
      </form>
    </div>
  );
};

export default CommentThread;
