"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Send, Mail, Phone, MapPin, CheckCircle } from "lucide-react"

export function ContactSection() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      console.log("Form submitted:", formData)
      
      // Show success toast
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      })
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: ""
      })
      setIsSubmitting(false)
    }, 1000)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  return (
    <section id="contact" className="py-32 sm:py-40 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white/50 dark:from-gray-800/50 to-transparent"></div>
      <div className="absolute top-20 right-[10%] w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-[10%] w-36 sm:w-56 md:w-72 h-36 sm:h-56 md:h-72 bg-purple-500/5 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10 px-8 sm:px-12 lg:px-16 max-w-[90rem] mx-auto">
        <motion.div 
          className="text-center max-w-5xl mx-auto mb-20 sm:mb-24"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          ref={ref}
        >
          <span className="inline-flex items-center px-4 py-2 mb-4 text-sm font-semibold rounded-full bg-gradient-to-r from-pink-500/10 via-blue-500/10 to-green-400/10 text-primary border border-white/10 backdrop-blur-sm shadow-md">
            <Mail className="w-4 h-4 mr-2 text-pink-500 animate-bounce" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400">Get In Touch</span>
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 font-heading bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400">Contact</span> Us
          </h2>
          <p className="text-xl sm:text-2xl md:text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80 leading-relaxed">
            Get in touch with our team to discuss your project
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 sm:gap-10">
            <motion.div 
              className="lg:col-span-2 space-y-8 sm:space-y-10"
              variants={containerVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
            >
              <motion.div variants={itemVariants} className="flex items-start space-x-4 sm:space-x-5">
                <div className="p-3 sm:p-4 rounded-lg bg-primary/10 text-primary">
                  <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-base sm:text-lg">Phone</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">+1 (555) 123-4567</p>
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="flex items-start space-x-4 sm:space-x-5">
                <div className="p-3 sm:p-4 rounded-lg bg-primary/10 text-primary">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-base sm:text-lg">Email</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">contact@identimarketing.com</p>
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="flex items-start space-x-4 sm:space-x-5">
                <div className="p-3 sm:p-4 rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-base sm:text-lg">Address</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">123 Marketing Street, Digital City, DC 12345</p>
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="bg-gray-100 dark:bg-gray-800 p-6 sm:p-8 rounded-xl">
                <h3 className="font-semibold mb-4 text-base sm:text-lg">Office Hours</h3>
                <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                  <li className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span>9:00 AM - 6:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Saturday:</span>
                    <span>10:00 AM - 4:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Sunday:</span>
                    <span>Closed</span>
                  </li>
                </ul>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-3xl p-8 sm:p-12 border-0 shadow-2xl dark:shadow-gray-900/50 relative overflow-hidden"
              variants={containerVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
            >
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-2 sm:space-y-3">
                    <label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="h-14 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-5 transition-all duration-200 outline-none"
                    />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="h-14 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-5 transition-all duration-200 outline-none"
                    />
                  </div>
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-2 sm:space-y-3">
                  <label htmlFor="phone" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={handleChange}
                    className="h-14 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-5 transition-all duration-200 outline-none"
                  />
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-2 sm:space-y-3">
                  <label htmlFor="message" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Your Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us about your project..."
                    rows={4}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    className="rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-5 py-4 transition-all duration-200 outline-none resize-none min-h-[140px]"
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full md:w-auto group relative z-20 h-16 px-10 md:px-14 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white text-lg font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-0 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-400"
                    disabled={isSubmitting}
                  >
                    <span className="relative z-10 flex items-center">
                      {isSubmitting ? "Sending..." : "Send Message"}
                      <Send className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 text-white" />
                    </span>
                  </Button>
                </motion.div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}