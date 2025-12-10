"use client"
import { useEffect, useRef, useState } from "react"
import { MessageCircle, X, Send, Bot, User, Phone, Mail, Building2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const BOT_NAME = "Identi AI Assistant"

interface Message {
  id: string;
  from: 'bot' | 'user';
  text: string;
  timestamp: Date;
  type?: 'text' | 'quick_reply' | 'form';
  options?: string[];
  formData?: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    message?: string;
  };
}

interface PredefinedQuestion {
  id: string;
  question: string;
  response: string;
  category: 'services' | 'pricing' | 'contact' | 'general';
  followUp?: string[];
}

const PREDEFINED_QUESTIONS: PredefinedQuestion[] = [
  {
    id: 'services',
    question: 'What services do you offer?',
    response: 'We offer comprehensive digital marketing services including:\n\n🚀 **SEO & Content Marketing**\n📱 **Social Media Management**\n🎨 **Web Design & Development**\n🤖 **AI Marketing Solutions**\n📊 **Analytics & Reporting**\n💼 **Brand Identity Design**\n\nWould you like to know more about any specific service?',
    category: 'services',
    followUp: ['SEO Services', 'Web Development', 'Social Media Marketing', 'AI Solutions']
  },
  {
    id: 'seo-services',
    question: 'SEO Services',
    response: 'Our SEO services include:\n\n🔍 **Technical SEO Audit**\n📝 **Keyword Research & Strategy**\n📄 **On-Page Optimization**\n🔗 **Link Building & Outreach**\n📊 **Local SEO for UK & US**\n📈 **Monthly Performance Reports**\n\nWe typically see 3-6x traffic increases within 6 months. Would you like a free SEO audit?',
    category: 'services',
    followUp: ['Get Free SEO Audit', 'View SEO Pricing', 'Ask about Local SEO', 'Contact SEO Team']
  },
  {
    id: 'web-development',
    question: 'Web Development',
    response: 'Our web development services include:\n\n💻 **Custom Website Design**\n📱 **Mobile-Responsive Development**\n⚡ **Fast Loading & SEO Optimized**\n🛒 **E-commerce Solutions**\n🔧 **WordPress & Custom CMS**\n🚀 **Performance Optimization**\n\nAll websites are built with modern technologies and best practices. Ready to discuss your project?',
    category: 'services',
    followUp: ['Get Web Development Quote', 'View Portfolio', 'Discuss Project', 'Contact Development Team']
  },
  {
    id: 'social-media-marketing',
    question: 'Social Media Marketing',
    response: 'Our social media marketing includes:\n\n📱 **Platform Strategy (Facebook, Instagram, LinkedIn, Twitter)**\n📝 **Content Creation & Scheduling**\n🎯 **Paid Social Advertising**\n📊 **Analytics & Performance Tracking**\n👥 **Community Management**\n🎨 **Visual Design & Branding**\n\nWe help businesses build engaged communities and drive conversions. Interested in a social media audit?',
    category: 'services',
    followUp: ['Get Social Media Audit', 'View Social Media Pricing', 'Discuss Strategy', 'Contact Social Team']
  },
  {
    id: 'ai-solutions',
    question: 'AI Solutions',
    response: 'Our AI marketing solutions include:\n\n🤖 **AI-Powered Content Generation**\n📊 **Predictive Analytics & Insights**\n🎯 **Smart Audience Targeting**\n💬 **AI Chatbots & Automation**\n📈 **Performance Optimization**\n🔮 **Future-Ready Marketing**\n\nWe use cutting-edge AI to deliver 3x faster results. Want to see how AI can transform your marketing?',
    category: 'services',
    followUp: ['AI Marketing Assessment', 'View AI Solutions', 'Discuss AI Strategy', 'Contact AI Team']
  },
  {
    id: 'pricing',
    question: 'What are your pricing options?',
    response: 'Our pricing is tailored to your business needs:\n\n💰 **Starter Package** - £299/month\n📈 **Growth Package** - £599/month\n🚀 **Enterprise Package** - Custom pricing\n\nEach package includes different services and features. Would you like a detailed breakdown or a custom quote?',
    category: 'pricing',
    followUp: ['Get Custom Quote', 'View Package Details', 'Schedule Consultation']
  },
  {
    id: 'contact',
    question: 'How can I contact you?',
    response: 'You can reach us through multiple channels:\n\n📧 **Email**: hello@identimarketing.com\n📞 **Phone**: +44-20-1234-5678\n💬 **Live Chat**: Right here!\n📍 **Office**: London, UK & New York, US\n\nWe typically respond within 2-4 hours during business hours.',
    category: 'contact',
    followUp: ['Schedule Call', 'Send Email', 'Book Consultation']
  },
  {
    id: 'seo',
    question: 'How long does SEO take to show results?',
    response: 'SEO is a long-term strategy with different phases:\n\n📅 **Month 1-3**: Technical improvements, content optimization\n📈 **Month 3-6**: Initial ranking improvements\n🚀 **Month 6-12**: Significant traffic and conversion growth\n\nWe provide monthly reports to track progress. Most clients see measurable improvements within 3-6 months.',
    category: 'services',
    followUp: ['SEO Audit', 'Content Strategy', 'Technical SEO']
  },
  {
    id: 'ai',
    question: 'Do you use AI in your marketing?',
    response: 'Yes! We leverage cutting-edge AI tools for:\n\n🤖 **Content Generation & Optimization**\n📊 **Predictive Analytics**\n🎯 **Audience Targeting**\n💬 **Chatbot & Customer Service**\n📈 **Performance Optimization**\n\nOur AI solutions help us deliver 3x faster results while maintaining quality and personalization.',
    category: 'services',
    followUp: ['AI Marketing Assessment', 'AI Content Strategy', 'AI Automation Setup']
  },
  {
    id: 'local-seo',
    question: 'Ask about Local SEO',
    response: 'Our Local SEO services help businesses dominate local search results:\n\n📍 **Google My Business Optimization**\n🗺️ **Local Citation Building**\n📱 **Location-Based Keywords**\n⭐ **Review Management**\n🏪 **Local Schema Markup**\n📊 **Local Analytics & Reporting**\n\nPerfect for businesses serving specific geographic areas in the UK & US.',
    category: 'services',
    followUp: ['Get Local SEO Audit', 'Local SEO Pricing', 'Contact Local SEO Team']
  },
  {
    id: 'ecommerce',
    question: 'E-commerce Solutions',
    response: 'Our e-commerce development includes:\n\n🛒 **Custom Online Stores**\n💳 **Payment Gateway Integration**\n📱 **Mobile Commerce Optimization**\n🔍 **E-commerce SEO**\n📊 **Analytics & Conversion Tracking**\n🚀 **Performance Optimization**\n\nWe help online businesses increase sales and improve user experience.',
    category: 'services',
    followUp: ['Get E-commerce Quote', 'View E-commerce Portfolio', 'Discuss E-commerce Project']
  }
];

export default function AIChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      from: 'bot', 
      text: 'Hi! 👋 I\'m your Identi AI Assistant. I\'m here to help you grow your business with our digital marketing expertise. How can I assist you today?', 
      timestamp: new Date(),
      type: 'quick_reply',
      options: ['What services do you offer?', 'What are your pricing options?', 'How can I contact you?', 'Do you use AI in your marketing?']
    }
  ])

  // Main question options that should appear after every response
  const mainQuestionOptions = [
    'What services do you offer?', 
    'What are your pricing options?', 
    'How can I contact you?', 
    'Do you use AI in your marketing?'
  ]

  // Function to handle "Back to Main Menu" option
  const handleBackToMain = () => {
    addMessage({ from: 'user', text: 'Back to Main Menu', type: 'text' })
    simulateTyping(() => {
      addMessage({ 
        from: 'bot', 
        text: 'Welcome back! How can I help you today?', 
        type: 'quick_reply',
        options: mainQuestionOptions
      })
    })
  }
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  })
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, open])

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const simulateTyping = (callback: () => void, delay: number = 1000) => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      callback()
    }, delay)
  }

  const handleQuickReply = (question: string) => {
    addMessage({ from: 'user', text: question, type: 'text' })
    
    // Handle "Back to Main Menu" option
    if (question === 'Back to Main Menu') {
      handleBackToMain()
      return
    }
    
    const predefined = PREDEFINED_QUESTIONS.find(q => q.question === question)
    if (predefined) {
      simulateTyping(() => {
        // Combine specific follow-up options with main question options
        const specificOptions = predefined.followUp || []
        const combinedOptions = [...specificOptions, 'Back to Main Menu', ...mainQuestionOptions]
        
        addMessage({ 
          from: 'bot', 
          text: predefined.response, 
          type: 'quick_reply',
          options: combinedOptions
        })
      })
    } else if (question.includes('Get Free SEO Audit') || question.includes('Get Social Media Audit') || question.includes('AI Marketing Assessment')) {
      simulateTyping(() => {
        addMessage({ 
          from: 'bot', 
          text: 'Excellent choice! I\'d be happy to arrange a free audit for you. Please provide your contact details and I\'ll make sure our team gets back to you within 24 hours with a comprehensive analysis.', 
          type: 'form'
        })
        setShowContactForm(true)
      })
    } else if (question.includes('Contact') || question.includes('Get in touch') || question.includes('Yes, I\'d like to be contacted')) {
      simulateTyping(() => {
        addMessage({ 
          from: 'bot', 
          text: 'Perfect! I\'d be happy to connect you with our team. Please provide your contact details and I\'ll make sure someone gets back to you within 24 hours.', 
          type: 'form'
        })
        setShowContactForm(true)
      })
    } else if (question.includes('Pricing') || question.includes('Quote')) {
      simulateTyping(() => {
        addMessage({ 
          from: 'bot', 
          text: 'Great! To provide you with an accurate quote, I\'ll need to understand your specific needs. Please provide your contact details and our team will reach out with a customized proposal.', 
          type: 'form'
        })
        setShowContactForm(true)
      })
    } else if (question.includes('View') || question.includes('Portfolio')) {
      simulateTyping(() => {
        addMessage({ 
          from: 'bot', 
          text: 'You can view our portfolio and case studies on our website. Would you like me to connect you with our team to discuss your specific project requirements?', 
          type: 'quick_reply',
          options: ['Yes, discuss my project', 'Get in touch', 'Back to Main Menu', ...mainQuestionOptions]
        })
      })
    } else {
      simulateTyping(() => {
        addMessage({ 
          from: 'bot', 
          text: 'That\'s a great question! Let me connect you with our team for a detailed answer. Would you like to provide your contact details so we can get back to you?', 
          type: 'quick_reply',
          options: ['Yes, I\'d like to be contacted', 'Get in touch', ...mainQuestionOptions]
        })
      })
    }
  }

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim()) return

    addMessage({ from: 'user', text: input, type: 'text' })
    const userInput = input.toLowerCase()
    setInput("")

    // Check for predefined questions
    const predefined = PREDEFINED_QUESTIONS.find(q => 
      q.question.toLowerCase().includes(userInput) || 
      userInput.includes(q.question.toLowerCase().split(' ')[0]) ||
      (q.id === 'seo-services' && (userInput.includes('seo') || userInput.includes('search engine'))) ||
      (q.id === 'web-development' && (userInput.includes('website') || userInput.includes('web development') || userInput.includes('web design'))) ||
      (q.id === 'social-media-marketing' && (userInput.includes('social media') || userInput.includes('facebook') || userInput.includes('instagram'))) ||
      (q.id === 'ai-solutions' && (userInput.includes('ai') || userInput.includes('artificial intelligence')))
    )

    if (predefined) {
      simulateTyping(() => {
        // Combine specific follow-up options with main question options
        const specificOptions = predefined.followUp || []
        const combinedOptions = [...specificOptions, 'Back to Main Menu', ...mainQuestionOptions]
        
        addMessage({ 
          from: 'bot', 
          text: predefined.response, 
          type: 'quick_reply',
          options: combinedOptions
        })
      })
    } else if (userInput.includes('contact') || userInput.includes('get in touch') || userInput.includes('email')) {
      simulateTyping(() => {
        addMessage({ 
          from: 'bot', 
          text: 'I\'d be happy to connect you with our team! Please provide your contact details and I\'ll make sure someone gets back to you within 24 hours.', 
          type: 'form'
        })
        setShowContactForm(true)
      })
    } else if (userInput.includes('pricing') || userInput.includes('cost') || userInput.includes('price')) {
      simulateTyping(() => {
        addMessage({ 
          from: 'bot', 
          text: 'Our pricing varies based on your specific needs. We offer:\n\n💰 **Starter Package** - £299/month\n📈 **Growth Package** - £599/month\n🚀 **Enterprise Package** - Custom pricing\n\nWould you like a custom quote or to schedule a consultation?', 
          type: 'quick_reply',
          options: ['Get Custom Quote', 'Schedule Consultation', 'View Package Details', 'Back to Main Menu', ...mainQuestionOptions]
        })
      })
    } else {
      simulateTyping(() => {
        addMessage({ 
          from: 'bot', 
          text: 'That\'s an interesting question! While I have extensive knowledge about our services, I\'d love to connect you with our expert team for a more detailed answer. Would you like to provide your contact details?', 
          type: 'quick_reply',
          options: ['Yes, contact me', 'Get in touch', 'Back to Main Menu', ...mainQuestionOptions]
        })
      })
    }
  }

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      addMessage({ 
        from: 'bot', 
        text: 'Please fill in all required fields (Name, Email, and Message).', 
        type: 'text'
      })
      return
    }

    // Show loading message
    addMessage({ 
      from: 'bot', 
      text: 'Sending your message...', 
      type: 'text'
    })

    try {
      console.log('Sending email with data:', contactForm)
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contactForm,
          type: 'question'
        }),
      })

      console.log('Email response status:', response.status)
      const result = await response.json()
      console.log('Email response:', result)

      if (response.ok) {
        addMessage({ 
          from: 'bot', 
          text: `Thank you ${contactForm.name}! I've sent your message to our team. We'll get back to you within 24 hours at ${contactForm.email}. Is there anything else I can help you with?`, 
          type: 'quick_reply',
          options: ['Schedule a call', 'Get in touch', 'Back to Main Menu', ...mainQuestionOptions]
        })
        setShowContactForm(false)
        setContactForm({ name: '', email: '', phone: '', company: '', message: '' })
      } else {
        addMessage({ 
          from: 'bot', 
          text: `I apologize, but there was an issue sending your message: ${result.error || 'Unknown error'}. Please try again or contact us directly at hello@identimarketing.com`, 
          type: 'quick_reply',
          options: ['Try again', 'Get in touch', 'Back to Main Menu', ...mainQuestionOptions]
        })
      }
    } catch (error) {
      console.error('Email sending error:', error)
      addMessage({ 
        from: 'bot', 
        text: `I apologize, but there was an issue sending your message: ${error instanceof Error ? error.message : 'Network error'}. Please try again or contact us directly at hello@identimarketing.com`, 
        type: 'quick_reply',
        options: ['Try again', 'Get in touch', ...mainQuestionOptions]
      })
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!open && (
          <motion.button
            key="open"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white rounded-full shadow-lg p-4 flex items-center gap-2 hover:scale-110 transition-all duration-300"
            onClick={() => setOpen(true)}
            aria-label="Open AI chat"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="font-bold">AI Assistant</span>
          </motion.button>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            className="w-96 max-w-xs bg-white/95 dark:bg-background/95 rounded-2xl shadow-2xl border border-white/30 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-bold text-base">{BOT_NAME}</span>
              </div>
              <button 
                onClick={() => setOpen(false)} 
                aria-label="Close chat"
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={chatRef} className="flex-1 px-4 py-3 overflow-y-auto max-h-80 text-sm space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <div className={`flex gap-2 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.from === 'bot' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[85%] ${msg.from === 'user' ? 'order-first' : ''}`}>
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          msg.from === 'bot' 
                            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100' 
                            : 'bg-green-100 text-green-900 dark:bg-green-900/20 dark:text-green-100'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                        <div className="text-xs opacity-70 mt-1">{formatTime(msg.timestamp)}</div>
                      </div>
                    </div>
                    {msg.from === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Quick Reply Options */}
                  {msg.type === 'quick_reply' && msg.options && (
                    <div className="flex flex-wrap gap-2 ml-8">
                      {msg.options.map((option, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => handleQuickReply(option)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Contact Form */}
                  {msg.type === 'form' && showContactForm && (
                    <Card className="ml-8 mt-2">
                      <CardContent className="p-4">
                        <form onSubmit={handleContactFormSubmit} className="space-y-3">
                          <div>
                            <Input
                              placeholder="Your Name"
                              value={contactForm.name}
                              onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Input
                              type="email"
                              placeholder="Your Email"
                              value={contactForm.email}
                              onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Input
                              placeholder="Phone (Optional)"
                              value={contactForm.phone}
                              onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Input
                              placeholder="Company (Optional)"
                              value={contactForm.company}
                              onChange={(e) => setContactForm(prev => ({ ...prev, company: e.target.value }))}
                            />
                          </div>
                          <div>
                            <textarea
                              className="w-full p-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Your message..."
                              rows={3}
                              value={contactForm.message}
                              onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" size="sm" className="flex-1">
                              Send Message
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => setShowContactForm(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-blue-100 text-blue-900 rounded-lg px-3 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-gray-200">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                autoFocus
              />
              <Button
                type="submit"
                size="sm"
                className="bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 hover:opacity-90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
