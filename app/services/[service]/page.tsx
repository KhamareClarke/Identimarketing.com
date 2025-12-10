import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// This would typically come from a CMS or API
const services = {
  "website-development": {
    title: "Website & App Development",
    description: "Custom web and mobile solutions built with cutting-edge technology to drive your business forward.",
    image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=2069",
    content: `
      <p>In today's digital landscape, your website is often the first point of contact between your business and potential customers. At Identimarketing, we specialize in creating stunning, functional websites that not only look great but also drive conversions and support your business goals.</p>
      
      <h2>Our Website Development Services</h2>
      <p>We offer comprehensive web development solutions tailored to your specific needs:</p>
      <ul>
        <li><strong>Custom Website Design:</strong> Unique, brand-aligned designs that stand out from the competition</li>
        <li><strong>E-commerce Development:</strong> Robust online stores with secure payment processing and inventory management</li>
        <li><strong>Content Management Systems:</strong> Easy-to-update websites built on WordPress, Shopify, or custom platforms</li>
        <li><strong>Responsive Design:</strong> Mobile-friendly websites that look great on all devices</li>
        <li><strong>Website Optimization:</strong> Fast-loading, SEO-friendly websites that rank well in search engines</li>
        <li><strong>Web Application Development:</strong> Custom web applications that streamline your business processes</li>
      </ul>
      
      <h2>Mobile App Development</h2>
      <p>Extend your digital presence with custom mobile applications:</p>
      <ul>
        <li><strong>iOS and Android Development:</strong> Native apps for both major platforms</li>
        <li><strong>Cross-platform Solutions:</strong> Cost-effective apps that work across multiple platforms</li>
        <li><strong>Progressive Web Apps:</strong> The best of websites and mobile apps combined</li>
        <li><strong>App Store Optimization:</strong> Strategies to increase app visibility and downloads</li>
      </ul>
      
      <h2>Our Development Process</h2>
      <p>We follow a proven development methodology to ensure your project is delivered on time and within budget:</p>
      <ol>
        <li><strong>Discovery:</strong> Understanding your business goals and user needs</li>
        <li><strong>Planning:</strong> Creating a detailed roadmap for your project</li>
        <li><strong>Design:</strong> Crafting visually appealing and user-friendly interfaces</li>
        <li><strong>Development:</strong> Building your website or app with clean, efficient code</li>
        <li><strong>Testing:</strong> Ensuring everything works perfectly across all devices</li>
        <li><strong>Launch:</strong> Deploying your website or app to the world</li>
        <li><strong>Maintenance:</strong> Ongoing support to keep everything running smoothly</li>
      </ol>
      
      <h2>Why Choose Us for Web Development?</h2>
      <p>When you partner with Identimarketing for your web development needs, you benefit from:</p>
      <ul>
        <li><strong>Technical Expertise:</strong> Our developers stay at the forefront of web technologies</li>
        <li><strong>Design Excellence:</strong> Beautiful, functional designs that engage users</li>
        <li><strong>SEO Integration:</strong> Websites built with search engine visibility in mind</li>
        <li><strong>Performance Focus:</strong> Fast-loading websites that provide excellent user experiences</li>
        <li><strong>Ongoing Support:</strong> We're with you long after your website launches</li>
      </ul>
    `,
    features: [
      "Custom Website Design",
      "E-commerce Development",
      "Content Management Systems",
      "Responsive Design",
      "Website Optimization",
      "Web Application Development",
      "Mobile App Development",
      "Progressive Web Apps"
    ]
  },
  "seo-services": {
    title: "SEO Services",
    description: "Boost your online visibility and rank higher in search results with our proven SEO strategies.",
    image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=2074",
    content: `
      <p>Search Engine Optimization (SEO) is the foundation of digital visibility. At Identimarketing, we provide comprehensive SEO services designed to improve your website's ranking in search engine results, drive organic traffic, and increase conversions.</p>
      
      <h2>Our SEO Services</h2>
      <p>We offer a full spectrum of SEO solutions to enhance your online presence:</p>
      <ul>
        <li><strong>Technical SEO:</strong> Optimizing your website's infrastructure to improve crawling and indexing</li>
        <li><strong>On-Page SEO:</strong> Enhancing individual pages to rank higher and earn more relevant traffic</li>
        <li><strong>Off-Page SEO:</strong> Building high-quality backlinks and improving online reputation</li>
        <li><strong>Local SEO:</strong> Helping local businesses appear in location-based searches</li>
        <li><strong>E-commerce SEO:</strong> Specialized optimization for online stores and product pages</li>
        <li><strong>Content Strategy:</strong> Creating valuable content that attracts and engages your target audience</li>
      </ul>
      
      <h2>Our SEO Process</h2>
      <p>We follow a data-driven approach to SEO that delivers measurable results:</p>
      <ol>
        <li><strong>Comprehensive Audit:</strong> Analyzing your current SEO performance and identifying opportunities</li>
        <li><strong>Competitor Analysis:</strong> Understanding what works in your industry</li>
        <li><strong>Keyword Research:</strong> Identifying the most valuable search terms for your business</li>
        <li><strong>Strategy Development:</strong> Creating a customized SEO roadmap</li>
        <li><strong>On-Site Optimization:</strong> Implementing technical and content improvements</li>
        <li><strong>Content Creation:</strong> Developing high-quality, SEO-friendly content</li>
        <li><strong>Link Building:</strong> Acquiring quality backlinks from reputable sources</li>
        <li><strong>Monitoring & Reporting:</strong> Tracking performance and making data-driven adjustments</li>
      </ol>
      
      <h2>Local SEO for UK & US Businesses</h2>
      <p>We specialize in local SEO for businesses in major cities across the United Kingdom and United States, including Stoke-on-Trent, London, Manchester, New York, and Los Angeles. Our local SEO services include:</p>
      <ul>
        <li><strong>Google Business Profile Optimization:</strong> Maximizing your local search visibility</li>
        <li><strong>Local Citation Building:</strong> Ensuring consistent business information across the web</li>
        <li><strong>Local Link Building:</strong> Acquiring links from relevant local websites</li>
        <li><strong>Review Management:</strong> Encouraging and managing customer reviews</li>
        <li><strong>Local Content Strategy:</strong> Creating content that resonates with your local audience</li>
      </ul>
      
      <h2>Why Choose Us for SEO?</h2>
      <p>When you partner with Identimarketing for SEO services, you benefit from:</p>
      <ul>
        <li><strong>Proven Results:</strong> A track record of improving rankings and driving organic traffic</li>
        <li><strong>Transparent Reporting:</strong> Clear, regular updates on your SEO performance</li>
        <li><strong>White Hat Techniques:</strong> Ethical SEO practices that build sustainable results</li>
        <li><strong>Industry Expertise:</strong> Specialized knowledge across various business sectors</li>
        <li><strong>Continuous Learning:</strong> We stay updated with the latest algorithm changes and SEO trends</li>
      </ul>
    `,
    features: [
      "Technical SEO Audits",
      "Keyword Research & Strategy",
      "On-Page Optimization",
      "Content Creation & Optimization",
      "Link Building",
      "Local SEO",
      "E-commerce SEO",
      "SEO Performance Reporting"
    ]
  },
  "digital-marketing": {
    title: "Digital Marketing",
    description: "Strategic digital marketing campaigns that deliver measurable results across all platforms.",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2074",
    content: `
      <p>In today's competitive digital landscape, a comprehensive marketing strategy is essential for business growth. At Identimarketing, we provide integrated digital marketing solutions that help you reach your target audience, build brand awareness, and drive conversions.</p>
      
      <h2>Our Digital Marketing Services</h2>
      <p>We offer a full suite of digital marketing services to help your business thrive online:</p>
      <ul>
        <li><strong>Search Engine Marketing (SEM):</strong> Paid search campaigns that drive immediate traffic and conversions</li>
        <li><strong>Social Media Marketing:</strong> Strategic social media campaigns across all major platforms</li>
        <li><strong>Content Marketing:</strong> Valuable, engaging content that attracts and retains your target audience</li>
        <li><strong>Email Marketing:</strong> Personalized email campaigns that nurture leads and drive sales</li>
        <li><strong>Conversion Rate Optimization (CRO):</strong> Improving your website to convert more visitors into customers</li>
        <li><strong>Analytics & Reporting:</strong> Data-driven insights to continuously improve your marketing performance</li>
      </ul>
      
      <h2>Our Digital Marketing Approach</h2>
      <p>We follow a strategic, results-focused approach to digital marketing:</p>
      <ol>
        <li><strong>Discovery:</strong> Understanding your business, audience, and objectives</li>
        <li><strong>Strategy Development:</strong> Creating a customized marketing plan aligned with your goals</li>
        <li><strong>Campaign Creation:</strong> Developing compelling campaigns across relevant channels</li>
        <li><strong>Implementation:</strong> Executing your marketing strategy with precision</li>
        <li><strong>Monitoring & Optimization:</strong> Continuously analyzing and improving campaign performance</li>
        <li><strong>Reporting & Analysis:</strong> Providing clear insights into your marketing results</li>
      </ol>
      
      <h2>Paid Advertising</h2>
      <p>Our paid advertising services help you reach your target audience quickly and efficiently:</p>
      <ul>
        <li><strong>Google Ads:</strong> Search, display, shopping, and video campaigns</li>
        <li><strong>Social Media Advertising:</strong> Targeted ads on Facebook, Instagram, LinkedIn, Twitter, and more</li>
        <li><strong>Remarketing:</strong> Re-engaging visitors who have shown interest in your business</li>
        <li><strong>Programmatic Advertising:</strong> Automated buying and optimization of digital ad space</li>
      </ul>
      
      <h2>Why Choose Us for Digital Marketing?</h2>
      <p>When you partner with Identimarketing for your digital marketing needs, you benefit from:</p>
      <ul>
        <li><strong>Integrated Approach:</strong> Cohesive marketing strategies across all digital channels</li>
        <li><strong>Data-Driven Decisions:</strong> Marketing based on analytics and performance metrics</li>
        <li><strong>Creative Excellence:</strong> Compelling content and designs that engage your audience</li>
        <li><strong>Industry Expertise:</strong> Specialized knowledge across various business sectors</li>
        <li><strong>Transparent Reporting:</strong> Clear communication about your marketing performance</li>
        <li><strong>ROI Focus:</strong> Strategies designed to maximize your return on investment</li>
      </ul>
    `,
    features: [
      "Search Engine Marketing (SEM)",
      "Social Media Marketing",
      "Content Marketing",
      "Email Marketing",
      "Conversion Rate Optimization",
      "Analytics & Reporting",
      "Paid Advertising",
      "Remarketing Campaigns"
    ]
  },
  "social-media": {
    title: "Social Media Management",
    description: "Engage your audience and build brand awareness with expert social media management.",
    image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=2074",
    content: `
      <p>Social media has become an essential channel for businesses to connect with their audience, build brand awareness, and drive engagement. At Identimarketing, we provide comprehensive social media management services that help you establish a strong presence across all relevant platforms.</p>
      
      <h2>Our Social Media Services</h2>
      <p>We offer a full range of social media solutions to enhance your online presence:</p>
      <ul>
        <li><strong>Social Media Strategy:</strong> Developing a customized plan aligned with your business goals</li>
        <li><strong>Content Creation:</strong> Producing engaging posts, graphics, videos, and other content</li>
        <li><strong>Community Management:</strong> Monitoring and responding to comments, messages, and mentions</li>
        <li><strong>Social Media Advertising:</strong> Creating and managing paid campaigns to reach your target audience</li>
        <li><strong>Influencer Marketing:</strong> Identifying and collaborating with relevant influencers in your industry</li>
        <li><strong>Analytics & Reporting:</strong> Tracking performance and providing actionable insights</li>
      </ul>
      
      <h2>Platforms We Specialize In</h2>
      <p>We have expertise across all major social media platforms:</p>
      <ul>
        <li><strong>Facebook:</strong> Building community and driving engagement through organic and paid strategies</li>
        <li><strong>Instagram:</strong> Creating visually compelling content that showcases your brand</li>
        <li><strong>Twitter:</strong> Engaging in real-time conversations and building brand awareness</li>
        <li><strong>LinkedIn:</strong> Establishing thought leadership and connecting with business professionals</li>
        <li><strong>TikTok:</strong> Creating trending, authentic content that resonates with younger audiences</li>
        <li><strong>Pinterest:</strong> Driving traffic and sales through visual discovery</li>
        <li><strong>YouTube:</strong> Developing video content strategies that build your channel</li>
      </ul>
      
      <h2>Our Social Media Process</h2>
      <p>We follow a strategic approach to social media management:</p>
      <ol>
        <li><strong>Audit & Analysis:</strong> Evaluating your current social media presence and identifying opportunities</li>
        <li><strong>Strategy Development:</strong> Creating a customized social media plan</li>
        <li><strong>Content Calendar:</strong> Planning and scheduling content for consistent posting</li>
        <li><strong>Content Creation:</strong> Developing engaging posts tailored to each platform</li>
        <li><strong>Community Management:</strong> Actively engaging with your audience</li>
        <li><strong>Paid Campaigns:</strong> Implementing targeted advertising to amplify your reach</li>
        <li><strong>Monitoring & Optimization:</strong> Continuously analyzing and improving performance</li>
        <li><strong>Reporting:</strong> Providing regular updates on key metrics and results</li>
      </ol>
      
      <h2>Why Choose Us for Social Media Management?</h2>
      <p>When you partner with Identimarketing for your social media needs, you benefit from:</p>
      <ul>
        <li><strong>Platform Expertise:</strong> Deep knowledge of each social media platform's unique features and algorithms</li>
        <li><strong>Creative Content:</strong> Engaging, on-brand content that resonates with your audience</li>
        <li><strong>Consistent Posting:</strong> Regular activity that keeps your brand top-of-mind</li>
        <li><strong>Community Building:</strong> Strategies that foster genuine connections with your audience</li>
        <li><strong>Data-Driven Approach:</strong> Decisions based on analytics and performance metrics</li>
        <li><strong>Trend Awareness:</strong> Staying ahead of social media trends and algorithm changes</li>
      </ul>
    `,
    features: [
      "Social Media Strategy",
      "Content Creation",
      "Community Management",
      "Social Media Advertising",
      "Influencer Marketing",
      "Analytics & Reporting",
      "Multi-Platform Management",
      "Social Media Audits"
    ]
  },
  "ai-solutions": {
    title: "AI Voice & Chatbots",
    description: "Automate customer interactions with intelligent AI solutions that work 24/7.",
    image: "https://images.unsplash.com/photo-1677442135136-760c813028c0?q=80&w=2070",
    content: `
      <p>Artificial Intelligence is revolutionizing customer service and engagement. At Identimarketing, we provide cutting-edge AI solutions including chatbots and voice assistants that enhance customer experience, streamline operations, and provide 24/7 support for your business.</p>
      
      <h2>Our AI Solutions</h2>
      <p>We offer a range of AI-powered tools to transform your customer interactions:</p>
      <ul>
        <li><strong>Custom Chatbots:</strong> Intelligent conversational agents for your website and messaging platforms</li>
        <li><strong>Voice Assistants:</strong> AI-powered voice interfaces for hands-free customer interactions</li>
        <li><strong>AI Customer Service:</strong> Automated support systems that handle common inquiries</li>
        <li><strong>Conversational Marketing:</strong> Engaging potential customers through natural dialogue</li>
        <li><strong>AI-Enhanced Analytics:</strong> Gaining deeper insights from customer interactions</li>
      </ul>
      
      <h2>Benefits of AI Solutions</h2>
      <p>Implementing our AI tools provides numerous advantages for your business:</p>
      <ul>
        <li><strong>24/7 Availability:</strong> Providing customer support around the clock</li>
        <li><strong>Instant Responses:</strong> Eliminating wait times for customer inquiries</li>
        <li><strong>Scalability:</strong> Handling multiple conversations simultaneously</li>
        <li><strong>Consistency:</strong> Delivering uniform information and brand messaging</li>
        <li><strong>Cost Efficiency:</strong> Reducing customer service operational costs</li>
        <li><strong>Data Collection:</strong> Gathering valuable customer insights</li>
        <li><strong>Human Resource Optimization:</strong> Freeing your team to focus on complex tasks</li>
      </ul>
      
      <h2>Our AI Development Process</h2>
      <p>We follow a comprehensive approach to creating effective AI solutions:</p>
      <ol>
        <li><strong>Needs Assessment:</strong> Understanding your business requirements and customer interactions</li>
        <li><strong>Solution Design:</strong> Creating a customized AI strategy</li>
        <li><strong>Knowledge Base Development:</strong> Building the information foundation for your AI</li>
        <li><strong>Conversation Flow Mapping:</strong> Designing natural, effective dialogue paths</li>
        <li><strong>Integration:</strong> Connecting your AI solution with existing systems</li>
        <li><strong>Training & Testing:</strong> Refining your AI for optimal performance</li>
        <li><strong>Deployment:</strong> Launching your AI solution</li>
        <li><strong>Continuous Improvement:</strong> Monitoring and enhancing based on real-world interactions</li>
      </ol>
      
      <h2>Applications of Our AI Solutions</h2>
      <p>Our AI tools can be implemented across various aspects of your business:</p>
      <ul>
        <li><strong>Customer Support:</strong> Answering FAQs and resolving common issues</li>
        <li><strong>Lead Generation:</strong> Qualifying prospects through conversational marketing</li>
        <li><strong>Appointment Scheduling:</strong> Managing bookings and reservations</li>
        <li><strong>Product Recommendations:</strong> Suggesting relevant products based on customer preferences</li>
        <li><strong>Order Processing:</strong> Facilitating purchases through conversational commerce</li>
        <li><strong>Feedback Collection:</strong> Gathering customer opinions and suggestions</li>
      </ul>
      
      <h2>Why Choose Us for AI Solutions?</h2>
      <p>When you partner with Identimarketing for AI implementation, you benefit from:</p>
      <ul>
        <li><strong>Technical Expertise:</strong> Advanced knowledge of AI and natural language processing</li>
        <li><strong>Customer-Centric Design:</strong> Solutions built around user experience</li>
        <li><strong>Integration Capabilities:</strong> Seamless connection with your existing systems</li>
        <li><strong>Ongoing Support:</strong> Continuous monitoring and improvement of your AI</li>
        <li><strong>Data Security:</strong> Strict adherence to privacy and security standards</li>
        <li><strong>Measurable Results:</strong> Clear reporting on performance and ROI</li>
      </ul>
    `,
    features: [
      "Custom Chatbots",
      "Voice Assistants",
      "AI Customer Service",
      "Conversational Marketing",
      "AI-Enhanced Analytics",
      "24/7 Customer Support",
      "Multi-Platform Integration",
      "Natural Language Processing"
    ]
  },
  "brand-identity": {
    title: "Brand Identity",
    description: "Create a memorable brand identity that resonates with your target audience.",
    image: "https://images.unsplash.com/photo-1434626881859-194d67b2b86f?q=80&w=2074",
    content: `
      <p>Your brand is more than just a logo—it's the complete experience customers have with your business. At Identimarketing, we provide comprehensive brand identity services that help you create a distinctive, cohesive, and memorable presence in the marketplace.</p>
      
      <h2>Our Brand Identity Services</h2>
      <p>We offer a full spectrum of branding solutions to establish and strengthen your market position:</p>
      <ul>
        <li><strong>Brand Strategy:</strong> Defining your brand's purpose, values, positioning, and personality</li>
        <li><strong>Logo Design:</strong> Creating distinctive visual marks that represent your brand</li>
        <li><strong>Visual Identity Systems:</strong> Developing comprehensive visual language including typography, color palettes, and imagery</li>
        <li><strong>Brand Guidelines:</strong> Creating detailed standards for consistent brand application</li>
        <li><strong>Brand Messaging:</strong> Crafting your brand voice, taglines, and key messages</li>
        <li><strong>Brand Applications:</strong> Implementing your brand across various touchpoints</li>
        <li><strong>Rebranding:</strong> Refreshing or completely transforming existing brand identities</li>
      </ul>
      
      <h2>Our Branding Process</h2>
      <p>We follow a strategic approach to brand development:</p>
      <ol>
        <li><strong>Discovery:</strong> Researching your industry, audience, competitors, and current brand perception</li>
        <li><strong>Strategy:</strong> Defining your brand positioning, values, and personality</li>
        <li><strong>Creative Development:</strong> Designing visual elements and crafting messaging</li>
        <li><strong>Refinement:</strong> Iterating based on feedback and strategic alignment</li>
        <li><strong>Finalization:</strong> Completing all brand assets and guidelines</li>
        <li><strong>Implementation:</strong> Applying your brand across all relevant touchpoints</li>
        <li><strong>Management:</strong> Providing ongoing support for brand consistency</li>
      </ol>
      
      <h2>Brand Applications</h2>
      <p>We help implement your brand across various media and touchpoints:</p>
      <ul>
        <li><strong>Digital Presence:</strong> Websites, social media, email templates, and digital advertising</li>
        <li><strong>Print Materials:</strong> Business cards, letterheads, brochures, and packaging</li>
        <li><strong>Environmental Design:</strong> Office spaces, retail environments, and signage</li>
        <li><strong>Marketing Collateral:</strong> Presentations, proposals, and promotional items</li>
        <li><strong>Product Design:</strong> Incorporating brand elements into your products</li>
      </ul>
      
      <h2>Why Brand Identity Matters</h2>
      <p>A strong brand identity provides numerous benefits for your business:</p>
      <ul>
        <li><strong>Recognition:</strong> Making your business instantly identifiable</li>
        <li><strong>Differentiation:</strong> Standing out in a crowded marketplace</li>
        <li><strong>Trust:</strong> Building credibility with your audience</li>
        <li><strong>Consistency:</strong> Creating cohesive experiences across all touchpoints</li>
        <li><strong>Connection:</strong> Forming emotional bonds with customers</li>
        <li><strong>Value:</strong> Supporting premium positioning and pricing</li>
        <li><strong>Loyalty:</strong> Encouraging repeat business and referrals</li>
      </ul>
      
      <h2>Why Choose Us for Brand Identity?</h2>
      <p>When you partner with Identimarketing for your branding needs, you benefit from:</p>
      <ul>
        <li><strong>Strategic Thinking:</strong> Brands built on solid business strategy</li>
        <li><strong>Creative Excellence:</strong> Distinctive, memorable design work</li>
        <li><strong>Market Understanding:</strong> Deep knowledge of various industries and audiences</li>
        <li><strong>Comprehensive Approach:</strong> Addressing all aspects of your brand experience</li>
        <li><strong>Implementation Expertise:</strong> Ensuring consistent application across all touchpoints</li>
        <li><strong>Long-term Partnership:</strong> Supporting your brand's evolution over time</li>
      </ul>
    `,
    features: [
      "Brand Strategy",
      "Logo Design",
      "Visual Identity Systems",
      "Brand Guidelines",
      "Brand Messaging",
      "Brand Applications",
      "Rebranding Services",
      "Brand Consistency Management"
    ]
  }
};

// Add this function to generate static paths for all services
export async function generateStaticParams() {
  return Object.keys(services).map((service) => ({
    service: service,
  }));
}

export default function ServicePage({ params }: { params: { service: string } }) {
  const service = services[params.service as keyof typeof services];
  
  if (!service) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 container py-16">
          <h1 className="text-3xl font-bold mb-4">Service Not Found</h1>
          <p className="mb-6">The service you're looking for doesn't exist or has been moved.</p>
          <Button asChild>
            <Link href="/#services">View All Services</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="relative h-[250px] sm:h-[300px] md:h-[400px] w-full">
          <Image
            src={service.image}
            alt={service.title}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/30"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="container px-4 sm:px-6 text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">{service.title}</h1>
              <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto">{service.description}</p>
            </div>
          </div>
        </div>
        
        <div className="container max-w-4xl py-8 sm:py-12 px-4 sm:px-6">
          <Button variant="ghost" className="mb-6 sm:mb-8 group text-xs sm:text-sm h-8 sm:h-9" asChild>
            <Link href="/#services" className="flex items-center">
              <ArrowLeft className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:-translate-x-1" />
              Back to all services
            </Link>
          </Button>
          
          <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: service.content }} />
          
          <div className="mt-10 sm:mt-16 bg-muted p-6 sm:p-8 rounded-lg">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Key Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {service.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-10 sm:mt-16 text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-base text-muted-foreground mb-6">Contact us today to discuss how our {service.title} services can help your business grow.</p>
            <Button size="lg" className="group relative overflow-hidden" asChild>
              <Link href="/#contact" className="flex items-center">
                <span className="relative z-10 flex items-center">
                  Contact Us
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 opacity-100 group-hover:opacity-90 transition-opacity"></span>
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}