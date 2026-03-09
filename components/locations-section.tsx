"use client"

import * as React from 'react'
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { MapPin, ArrowRight, Globe, Sparkles, Zap, Briefcase, Users, Target, Award } from "lucide-react"
import { TypewriterEffect } from "./typewriter-effect"

const stats = [
  { value: 20, label: "Office Locations", suffix: "+", icon: MapPin, color: "from-pink-500 to-purple-500" },
  { value: 100, label: "Local SEO Experts", suffix: "+", icon: Users, color: "from-blue-500 to-cyan-500" },
  { value: 1000, label: "Digital Projects", suffix: "+", icon: Target, color: "from-amber-500 to-red-500" },
  { value: 10, label: "Years Experience", suffix: "+", icon: Award, color: "from-emerald-500 to-teal-500" }
];

function AnimatedCounter({ value, suffix = "", delay = 0, className = "" }: { value: number; suffix?: string; delay?: number; className?: string }) {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    const duration = 1500;
    const steps = 50;
    const stepDuration = duration / steps;
    let currentStep = 0;
    
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(value * easedProgress));
        
        if (currentStep >= steps) {
          clearInterval(interval);
          setCount(value);
        }
      }, stepDuration);
      
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return <span className={className}>{count}{suffix}</span>;
}

export function LocationsSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 20
      }
    },
    hover: {
      y: -5,
      transition: { duration: 0.2 }
    }
  };

  return (
    <section id="locations" className="py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden bg-gradient-to-b from-background to-background/90">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-pink-500/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-3xl"></div>
      </div>
      
      <Container size="wide" className="relative z-10">
        <motion.div 
          className="text-center max-w-4xl mx-auto mb-8 sm:mb-12 md:mb-16 lg:mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          ref={ref}
        >
          <motion.div 
            className="inline-flex items-center px-4 py-2 mb-4 sm:mb-6 text-sm sm:text-base font-medium rounded-full bg-gradient-to-r from-pink-500/10 via-blue-500/10 to-green-400/10 text-primary border border-white/10 backdrop-blur-sm group"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-pink-500 group-hover:rotate-12 transition-transform duration-300" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400">
                Global Reach
              </span>
            </div>
          </motion.div>
          
          <motion.div 
            className="text-center mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <TypewriterEffect 
              words={["Local Leverage,", "Global Reach"]} 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-center"
              textClassName="font-heading bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80"
              highlightClassName="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400"
            />
          </motion.div>
          
          <motion.div 
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="text-lg sm:text-xl text-muted-foreground mb-8">
              We help businesses in <span className="font-medium text-foreground">London</span>, <span className="font-medium text-foreground">Manchester</span>, <span className="font-medium text-foreground">Birmingham</span>, <span className="font-medium text-foreground">Edinburgh</span>, <span className="font-medium text-foreground">Glasgow</span>, <span className="font-medium text-foreground">Stoke-on-Trent</span>, and across the US grow with custom digital strategies.
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
              {["SEO", "PPC", "Web Design", "Social Media", "Content Marketing", "Branding"].map((tag, i) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ duration: 0.3, delay: 0.5 + (i * 0.05) }}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-muted/50 text-muted-foreground border border-border/30"
                >
                  {i === 0 && <Zap className="w-3 h-3 mr-1 text-amber-500" />}
                  {i === 1 && <Briefcase className="w-3 h-3 mr-1 text-blue-500" />}
                  {i === 2 && <Globe className="w-3 h-3 mr-1 text-emerald-500" />}
                  {tag}
                </motion.span>
              ))}
            </div>
          </motion.div>
          
          {/* Stats Section */}
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12 md:mb-16"
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={containerVariants}
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div 
                  key={stat.label}
                  variants={itemVariants}
                  className="group relative overflow-hidden bg-background/70 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-white/20"
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-xl sm:rounded-2xl bg-gradient-to-br ${stat.color} mb-2 mx-auto shadow-lg`}>
                      <AnimatedCounter 
                        value={stat.value} 
                        suffix={stat.suffix} 
                        delay={index * 100}
                        className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight"
                      />
                    </div>
                    
                    <p className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200 mt-2 text-center">{stat.label}</p>
                    
                    <div className={`absolute -bottom-4 -right-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full ${stat.color.split(' ')[0]}/10 group-hover:opacity-100 opacity-0 transition-all duration-500`}></div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <Tabs defaultValue="uk" className="w-full">
            <TabsList className="grid w-full max-w-xs sm:max-w-md mx-auto grid-cols-2 mb-6 sm:mb-8 md:mb-12 p-1 sm:p-1.5 bg-muted/30 backdrop-blur-sm border border-white/10 rounded-full overflow-hidden">
              <TabsTrigger 
                value="uk" 
                className="relative text-xs sm:text-sm md:text-base font-medium data-[state=active]:text-white rounded-full z-10 transition-all duration-300 group py-2 sm:py-2.5"
              >
                <span className="relative z-10">United Kingdom</span>
                <motion.span 
                  className="absolute inset-0 bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 rounded-full z-0 opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"
                  layoutId="activeTab"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              </TabsTrigger>
              <TabsTrigger 
                value="us" 
                className="relative text-xs sm:text-sm md:text-base font-medium data-[state=active]:text-white rounded-full z-10 transition-all duration-300 group py-2 sm:py-2.5"
              >
                <span className="relative z-10">United States</span>
                <motion.span 
                  className="absolute inset-0 bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 rounded-full z-0 opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"
                  layoutId="activeTab"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              </TabsTrigger>
            </TabsList>
            <TabsContent value="uk" className="space-y-6 sm:space-y-8">
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8"
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                variants={containerVariants}
              >
                <motion.div variants={itemVariants}>
                  <Card className="group relative overflow-hidden h-full border border-white/10 bg-background/70 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <CardHeader className="relative z-10 p-4 sm:p-6 md:p-8">
                      <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                          Major Cities
                        </CardTitle>
                      <CardDescription className="text-sm sm:text-base">
                        Our UK digital marketing experts span across these major metropolitan areas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 p-4 sm:p-6 md:p-8 pt-0">
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
  {['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Stoke-on-Trent', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Nottingham', 'Leicester'].map((city, i) => (
    <motion.div
      key={city}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.05 * i }}
      className="rounded-lg bg-white/70 dark:bg-background/70 px-2 py-2 sm:py-1 flex flex-col items-center justify-center relative overflow-hidden min-h-[3rem] sm:min-h-[2.5rem]"
    >
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 rounded-t-lg opacity-80" />
      <span className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white text-center tracking-tight leading-tight px-1">
        {city}
      </span>
    </motion.div>
  ))}
</div>
                    </CardContent>
                    <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="group relative overflow-hidden h-full border border-white/10 bg-background/70 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <CardHeader className="relative z-10 p-4 sm:p-6 md:p-8">
                      <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                          Coverage Map
                        </CardTitle>
                      <CardDescription className="text-sm sm:text-base">
                        We serve clients across the entire United Kingdom with our expert digital marketing services
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 p-0 overflow-hidden rounded-b-xl">
                      <div className="relative aspect-video bg-muted/50">
                        <iframe
                          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4887593.146285947!2d-7.572167452183775!3d54.55932273695832!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761cb8f6b6b1b1%3A0x4c0d0c0d0c0d0c0d!2sUnited%20Kingdom!5e0!3m2!1sen!2suk!4v1631122334455!5m2!1sen!2suk"
                          title="UK Coverage Map"
                          width="100%"
                          height="300"
                          style={{ border: 0, borderRadius: '1rem' }}
                          allowFullScreen={true}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 pt-16 bg-gradient-to-t from-background/90 to-transparent">
                          <Button 
                            variant="outline" 
                            className="w-full backdrop-blur-sm border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all group/button"
                            size="lg"
                          >
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-500 group-hover/button:from-white group-hover/button:to-white transition-colors">
                              View Full Coverage
                            </span>
                            <ArrowRight className="ml-2 h-4 w-4 text-blue-400 group-hover/button:text-white transition-colors" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                    <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>
            <TabsContent value="us" className="space-y-6 sm:space-y-8">
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8"
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                variants={containerVariants}
              >
                <motion.div variants={itemVariants}>
                  <Card className="group relative overflow-hidden h-full border border-white/10 bg-background/70 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <CardHeader className="relative z-10 p-4 sm:p-6 md:p-8">
                      <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                          Major Cities
                        </CardTitle>
                      <CardDescription className="text-sm sm:text-base">
                        Our US digital marketing experts span across these major metropolitan areas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 p-4 sm:p-6 md:p-8 pt-0">
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
  {['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco', 'Boston', 'Dallas', 'Houston', 'Atlanta', 'Seattle', 'Washington DC', 'Philadelphia', 'Phoenix', 'Denver', 'Detroit', 'San Diego', 'Minneapolis', 'Orlando', 'Austin', 'Las Vegas'].map((city, i) => (
    <motion.div
      key={city}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.05 * i }}
      className="rounded-lg bg-white/70 dark:bg-background/70 px-2 py-2 sm:py-1 flex flex-col items-center justify-center relative overflow-hidden min-h-[3rem] sm:min-h-[2.5rem]"
    >
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 rounded-t-lg opacity-80" />
      <span className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white text-center tracking-tight leading-tight px-1">
        {city}
      </span>
    </motion.div>
  ))}
</div>
                    </CardContent>
                    <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="group relative overflow-hidden h-full border border-white/10 bg-background/70 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <CardHeader className="relative z-10 p-4 sm:p-6 md:p-8">
                      <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                          Coverage Map
                        </CardTitle>
                      <CardDescription className="text-sm sm:text-base">
                        We serve clients across the entire United States with our expert digital marketing services
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 p-0 overflow-hidden rounded-b-xl">
                      <div className="relative aspect-video bg-muted/50">
                        <iframe
                          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12651245.936047442!2d-123.72601826058664!3d37.27514261073609!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54eab5b7b2b4b7b5%3A0x8c0d0c0d0c0d0c0d!2sUnited%20States!5e0!3m2!1sen!2sus!4v1631122334456!5m2!1sen!2sus"
                          title="US Coverage Map"
                          width="100%"
                          height="300"
                          style={{ border: 0, borderRadius: '1rem' }}
                          allowFullScreen={true}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 pt-16 bg-gradient-to-t from-background/90 to-transparent">
                          <Button 
                            variant="outline" 
                            className="w-full backdrop-blur-sm border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all group/button"
                            size="lg"
                          >
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-500 group-hover/button:from-white group-hover/button:to-white transition-colors">
                              View Full Coverage
                            </span>
                            <ArrowRight className="ml-2 h-4 w-4 text-blue-400 group-hover/button:text-white transition-colors" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                    <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </Container>
    </section>
  )
}