import { useState } from 'react';
import { supabase } from '../utils/supabase';

function PostForm() {
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Увійдіть, щоб створити пост!');

    const { error } = await supabase
      .from('posts')
      .insert([{ user_id: user.id, content }]);
    if (error) alert(error.message);
    else setContent('');
  };

  return (
    <div className="p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Що у вас нового?"
        className="border p-2 w-full"
      />
      <button onClick={handleSubmit} className="bg-green-500 text-white p-2">
        Опублікувати
      </button>
    </div>
  );
}

export default PostForm;