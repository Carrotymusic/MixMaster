
import React, { useState } from 'react';
import { sendTelegramMessage } from '../services/telegram';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    const success = await sendTelegramMessage(formData.name, formData.email, formData.message);
    
    if (success) {
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } else {
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-[700px] mx-auto bg-white/5 backdrop-blur-md border border-white/10 p-12 rounded overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-carroty to-transparent"></div>
      
      {/* Name Input */}
      <div className="relative mb-10 group">
        <input 
          type="text" 
          name="name" 
          value={formData.name}
          onChange={handleChange}
          required
          placeholder=" "
          className="peer w-full bg-transparent border-none border-b border-[#333] py-4 text-white font-grotesk text-xl outline-none focus:ring-0 z-10 relative"
        />
        <label className="absolute top-4 left-0 text-[#666] text-xl transition-all duration-300 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-carroty peer-focus:tracking-widest peer-focus:uppercase peer-not-placeholder-shown:-top-5 peer-not-placeholder-shown:text-sm peer-not-placeholder-shown:text-carroty peer-not-placeholder-shown:tracking-widest">
          Imię / Artysta
        </label>
        <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-carroty transition-all duration-500 -translate-x-1/2 peer-focus:w-full"></span>
      </div>

      {/* Email Input */}
      <div className="relative mb-10 group">
        <input 
          type="email" 
          name="email" 
          value={formData.email}
          onChange={handleChange}
          required
          placeholder=" "
          className="peer w-full bg-transparent border-none border-b border-[#333] py-4 text-white font-grotesk text-xl outline-none focus:ring-0 z-10 relative"
        />
        <label className="absolute top-4 left-0 text-[#666] text-xl transition-all duration-300 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-carroty peer-focus:tracking-widest peer-focus:uppercase peer-not-placeholder-shown:-top-5 peer-not-placeholder-shown:text-sm peer-not-placeholder-shown:text-carroty peer-not-placeholder-shown:tracking-widest">
          Adres Email
        </label>
        <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-carroty transition-all duration-500 -translate-x-1/2 peer-focus:w-full"></span>
      </div>

      {/* Message Input */}
      <div className="relative mb-10 group">
        <textarea 
          name="message" 
          value={formData.message}
          onChange={handleChange}
          required
          rows={1}
          placeholder=" "
          className="peer w-full bg-transparent border-none border-b border-[#333] py-4 text-white font-grotesk text-xl outline-none focus:ring-0 z-10 relative min-h-[50px] resize-y"
        />
        <label className="absolute top-4 left-0 text-[#666] text-xl transition-all duration-300 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-carroty peer-focus:tracking-widest peer-focus:uppercase peer-not-placeholder-shown:-top-5 peer-not-placeholder-shown:text-sm peer-not-placeholder-shown:text-carroty peer-not-placeholder-shown:tracking-widest">
          Szczegóły Projektu...
        </label>
        <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-carroty transition-all duration-500 -translate-x-1/2 peer-focus:w-full"></span>
      </div>

      <button 
        type="submit" 
        disabled={status === 'sending' || status === 'success'}
        className="relative w-full p-6 bg-transparent border border-carroty text-carroty font-syne font-bold text-xl uppercase cursor-pointer overflow-hidden transition-all duration-300 group hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="absolute top-0 -left-full w-full h-full bg-carroty transition-all duration-500 ease-out group-hover:left-0 z-0"></span>
        <span className="relative z-10 flex items-center justify-center gap-2">
          {status === 'idle' && <>WYŚLIJ ZAPYTANIE <Send size={20} /></>}
          {status === 'sending' && 'WYSYŁANIE...'}
          {status === 'success' && <>WYSŁANO! <CheckCircle size={20} /></>}
          {status === 'error' && <>BŁĄD - SPRÓBUJ PONOWNIE <AlertCircle size={20} /></>}
        </span>
      </button>
    </form>
  );
};

export default ContactForm;