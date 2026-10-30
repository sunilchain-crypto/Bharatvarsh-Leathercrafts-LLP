import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { aiService } from '../services/aiService';
import {
  Sparkles,
  X,
  Send,
  Ruler,
  Droplets,
  Clock,
  Gift,
  HelpCircle,
  ShieldCheck,
  Check,
  ChevronRight,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';

interface LeatherConciergeWidgetProps {
  currentProduct?: Product | null;
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
  onOpenProduct?: (product: Product) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'concierge';
  text: string;
  timestamp: string;
  isQuickAction?: boolean;
}

export const LeatherConciergeWidget: React.FC<LeatherConciergeWidgetProps> = ({
  currentProduct,
  isOpenExternal,
  onCloseExternal
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<'chat' | 'sizing_calc'>('chat');

  // Quick Belt Calculator State
  const [trouserSize, setTrouserSize] = useState<number>(34);

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'concierge',
      text: `Greetings from the Bharatvarsh Leathercrafts Atelier. I am your Master Leather Artisan & Private Client Concierge.\n\nWhether you need precision **Belt Sizing advice**, care protocols for **Indian humidity & monsoons**, or **bespoke 22k gold monogramming recommendations**, how may I assist your craftsmanship journey today?`,
      timestamp: 'Just now'
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync external open state if provided
  useEffect(() => {
    if (isOpenExternal !== undefined) {
      setIsOpen(isOpenExternal);
    }
  }, [isOpenExternal]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // When currentProduct changes and drawer is open, add contextual note
  useEffect(() => {
    if (currentProduct && isOpen) {
      const prodNoteId = `prod_${currentProduct.id}`;
      // Add if not already the last message
      setMessages((prev) => {
        if (prev.some((m) => m.id === prodNoteId)) return prev;
        return [
          ...prev,
          {
            id: prodNoteId,
            sender: 'concierge',
            text: `I see you are admiring **"${currentProduct.name}"** handcrafted from ${currentProduct.leatherType || 'vegetable-tanned full-grain leather'}. Would you like specific sizing dimensions or leather conditioning guidance for this piece?`,
            timestamp: 'Just now'
          }
        ];
      });
    }
  }, [currentProduct, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const reply = await aiService.sendConciergeMessage(text, currentProduct);
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'concierge',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'concierge',
        text: 'Our atelier master is currently hand-stitching bespoke commissions. For immediate belt sizing, choose +2 inches over your pant waist size. How else may we guide you?',
        timestamp: 'Just now'
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onCloseExternal) onCloseExternal();
  };

  // Quick prompt questions
  const quickPrompts = currentProduct?.productType.toLowerCase().includes('belt')
    ? [
        { label: '📏 Indian Belt Sizing Guide', query: 'How do I pick the right belt size for my trouser waist in India?' },
        { label: '💧 Monsoon & Humidity Care', query: 'How do I care for vegetable-tanned leather during Indian monsoons?' },
        { label: '⏳ Patina Transformation', query: 'How will this bridle leather develop patina and darken over time?' },
        { label: '✨ 22K Gold Debossing', query: 'What monogram placement and font style works best for this belt?' }
      ]
    : [
        { label: '📏 Size & Fit Consultation', query: 'How do I ensure perfect sizing and capacity for this leather item?' },
        { label: '💧 Rain & Humidity Care', query: 'How should I condition vegetable-tanned leather in humid climates?' },
        { label: '🏺 Patina Development', query: 'What does the vegetable-tanned leather patina journey look like?' },
        { label: '🎁 Bespoke Gift Box & Monogram', query: 'What are the gifting options, crest debossing, and presentation casket details?' }
      ];

  // Belt sizing calculation logic
  const recommendedBeltSize = trouserSize + 2;
  const beltLengthCm = Math.round(recommendedBeltSize * 2.54);

  return (
    <>
      {/* Floating Concierge Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] rounded-full shadow-2xl border border-[#C29B38]/40 hover:scale-105 transition-all duration-300 cursor-pointer group"
          aria-label="Open Leather Care & Sizing Concierge"
        >
          <div className="relative w-7 h-7 rounded-full bg-[#783A1D] flex items-center justify-center border border-[#C29B38]">
            <Sparkles className="w-3.5 h-3.5 text-[#C29B38] animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#24140D]" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#FAF7F2]">
              Atelier Concierge
            </div>
            <div className="text-[10px] text-[#C29B38] font-medium leading-none">
              Leather Care & Sizing
            </div>
          </div>
        </button>
      )}

      {/* Floating Concierge Drawer / Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-105 h-[580px] max-h-[85vh] bg-[#FAF7F2] rounded-2xl shadow-2xl border border-[#24140D]/20 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-250">
          
          {/* Header */}
          <div className="p-4 bg-[#24140D] text-[#FAF7F2] flex items-center justify-between border-b border-[#C29B38]/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#783A1D] flex items-center justify-center border border-[#C29B38]/50 shadow-inner">
                <Sparkles className="w-4 h-4 text-[#C29B38]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-sm font-bold tracking-wide text-[#FAF7F2]">
                    Bharatvarsh Atelier Concierge
                  </h3>
                  <span className="text-[9px] bg-emerald-950/80 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-500/40 uppercase font-mono">
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-[#D4B37A]">
                  AI Master Leather Artisan · Kanpur Heritage
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-[#FAF7F2]/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close concierge"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Product Bar (if browsing an item) */}
          {currentProduct && (
            <div className="px-4 py-2 bg-[#EFE9DF] border-b border-[#24140D]/10 flex items-center justify-between text-xs text-[#24140D]">
              <div className="truncate flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#783A1D] shrink-0" />
                <span className="text-[11px] text-[#24140D]/70">Product Context:</span>
                <strong className="text-[11px] truncate font-serif text-[#783A1D]">
                  {currentProduct.name}
                </strong>
              </div>
              <span className="text-[10px] font-mono text-[#24140D]/60 shrink-0 ml-2">
                ₹{currentProduct.price.toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {/* View Mode Toggle: Interactive Chat vs Quick Belt Calculator */}
          <div className="px-3 py-1.5 bg-[#FAF7F2] border-b border-[#24140D]/10 flex items-center gap-2 text-xs">
            <button
              onClick={() => setSelectedTopic('chat')}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                selectedTopic === 'chat'
                  ? 'bg-[#24140D] text-[#FAF7F2]'
                  : 'text-[#24140D]/70 hover:bg-[#EFE9DF]'
              }`}
            >
              Artisan Consultation
            </button>
            <button
              onClick={() => setSelectedTopic('sizing_calc')}
              className={`px-3 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                selectedTopic === 'sizing_calc'
                  ? 'bg-[#24140D] text-[#FAF7F2]'
                  : 'text-[#24140D]/70 hover:bg-[#EFE9DF]'
              }`}
            >
              <Ruler className="w-3 h-3 text-[#C29B38]" />
              <span>Belt Size Calculator</span>
            </button>
          </div>

          {/* Content Area */}
          {selectedTopic === 'chat' ? (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-3.5 shadow-xs leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-[#783A1D] text-white rounded-br-xs'
                          : 'bg-white border border-[#24140D]/10 text-[#24140D] rounded-bl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-line text-[11.5px]">
                        {m.text}
                      </div>
                    </div>
                    <span className="text-[9px] text-[#24140D]/50 px-1 mt-1 font-mono">
                      {m.timestamp}
                    </span>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-[11px] text-[#783A1D] bg-white border border-[#24140D]/10 p-3 rounded-2xl w-fit shadow-xs">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C29B38]" />
                    <span>Master artisan consulting tannery archives...</span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompts Carousel */}
              <div className="p-2 bg-[#FAF7F2] border-t border-[#24140D]/10">
                <div className="text-[10px] text-[#24140D]/60 uppercase tracking-wider font-semibold mb-1 px-1">
                  Common Inquiries:
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {quickPrompts.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q.query)}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-full bg-white hover:bg-[#EFE9DF] text-[#783A1D] border border-[#24140D]/15 text-[10.5px] font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-[#24140D]/10 flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask about belt sizes, monsoon care, patina..."
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/15 rounded-xl text-xs focus:outline-none focus:border-[#783A1D] placeholder:text-[#24140D]/40"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  aria-label="Send message"
                  className="w-8 h-8 rounded-xl bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-3.5 h-3.5 text-[#C29B38]" />
                </button>
              </div>
            </>
          ) : (
            /* Interactive Belt Sizing Calculator View */
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-[#24140D]/10 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-[#783A1D] font-bold text-xs uppercase tracking-wider">
                  <Ruler className="w-4 h-4 text-[#C29B38]" />
                  <span>The Master Belt Sizing Formula</span>
                </div>
                <p className="text-[#24140D]/80 leading-relaxed text-[11px]">
                  Leather belts should never be ordered in your exact pant waist size. Because belts loop over trousers and waistband seams, standard practice is:
                </p>
                <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#783A1D]/20 text-center">
                  <span className="font-serif text-sm font-bold text-[#24140D]">
                    Trouser Size + 2 Inches = Perfect Bharatvarsh Belt
                  </span>
                </div>
              </div>

              {/* Interactive Sizing Sliders */}
              <div className="p-4 rounded-xl bg-white border border-[#24140D]/10 shadow-xs space-y-4">
                <label className="block text-[#24140D] font-semibold">
                  What is your standard pant / jeans waist size?
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={28}
                    max={46}
                    step={2}
                    value={trouserSize}
                    onChange={(e) => setTrouserSize(Number(e.target.value))}
                    className="flex-1 accent-[#783A1D] cursor-pointer"
                  />
                  <span className="font-mono font-bold text-base text-[#783A1D] w-12 text-right">
                    {trouserSize}&quot;
                  </span>
                </div>

                {/* Calculation Output */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#24140D]/10 text-center">
                    <span className="text-[10px] text-[#24140D]/60 uppercase tracking-wider block font-semibold">
                      Order Belt Size
                    </span>
                    <span className="font-serif text-xl font-bold text-[#783A1D]">
                      {recommendedBeltSize}&quot;
                    </span>
                    <span className="text-[10px] text-[#24140D]/60 block mt-0.5">
                      ({beltLengthCm} cm)
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#24140D]/10 text-center">
                    <span className="text-[10px] text-[#24140D]/60 uppercase tracking-wider block font-semibold">
                      Middle Hole Fasten
                    </span>
                    <span className="font-serif text-xl font-bold text-emerald-800">
                      Hole #3
                    </span>
                    <span className="text-[10px] text-[#24140D]/60 block mt-0.5">
                      (2 holes on each side)
                    </span>
                  </div>
                </div>

                {/* Visual Representation of 5 Holes */}
                <div className="pt-2 space-y-1.5">
                  <div className="text-[10px] text-[#24140D]/60 font-semibold uppercase">
                    Belt Tongue Hole Calibration:
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#24140D] rounded-lg text-white">
                    {[1, 2, 3, 4, 5].map((hole) => (
                      <div key={hole} className="flex flex-col items-center gap-1">
                        <div
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                            hole === 3
                              ? 'bg-[#C29B38] text-[#24140D] ring-2 ring-white'
                              : 'bg-white/20 text-white/70'
                          }`}
                        >
                          {hole}
                        </div>
                        <span className="text-[8px] text-white/60">
                          {hole === 3 ? 'Target' : hole < 3 ? 'Tight' : 'Loose'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedTopic('chat');
                    handleSendMessage(`I wear a ${trouserSize}" pant waist. Can you explain why the ${recommendedBeltSize}" belt will fit me best?`);
                  }}
                  className="w-full py-2 bg-[#783A1D] hover:bg-[#8F4725] text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Ask Artisan to Confirm Sizing</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </>
  );
};
