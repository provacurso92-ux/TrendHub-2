import React from 'react';

export function TypingIndicator({ typingUser }: { typingUser: any }) {
  return (
    <div className="flex items-end gap-3 mb-2">
      <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
        {typingUser?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={typingUser.avatar_url} alt={typingUser.username || 'avatar'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white bg-violet-600">
            {typingUser?.username?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1 max-w-fit">
        <span className="typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot" style={{ animationDelay: '150ms' }} />
        <span className="typing-dot" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

export default TypingIndicator;
