  // src/app/landing/landing.component.ts
  import { Component, OnInit } from '@angular/core';
  import { Router } from '@angular/router';

  @Component({
    selector: 'app-landing',
    standalone: false,
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.css']
  })
  export class LandingComponent implements OnInit {
    
    // Datos para la sección de servicios
    services = [
      {
        icon: 'fas fa-code',
        title: 'Desarrollo de Software',
        description: 'Aplicaciones web y móviles personalizadas para optimizar tus procesos empresariales.',
        features: ['Desarrollo a medida', 'Apps móviles', 'Sistemas web', 'APIs y microservicios']
      },
      {
        icon: 'fas fa-cloud',
        title: 'Infraestructura Cloud',
        description: 'Migración y gestión de servicios en la nube para mayor escalabilidad y eficiencia.',
        features: ['Migración a la nube', 'AWS/Azure/GCP', 'Backup automático', 'Monitoreo 24/7']
      },
      {
        icon: 'fas fa-shield-alt',
        title: 'Ciberseguridad',
        description: 'Protección integral de tus datos y sistemas contra amenazas digitales.',
        features: ['Auditorías de seguridad', 'Firewall avanzado', 'Antivirus empresarial', 'Capacitación personal']
      },
      {
        icon: 'fas fa-chart-line',
        title: 'Consultoría IT',
        description: 'Estrategias tecnológicas para optimizar la eficiencia y reducir costos operativos.',
        features: ['Análisis de procesos', 'Roadmap tecnológico', 'Optimización IT', 'Gestión de proyectos']
      }
    ];

    // Datos para la sección de planes
    pricingPlans = [
      {
        name: 'Básico',
        price: 'Q2,500',
        period: 'por mes',
        features: [
          'Soporte técnico básico',
          'Mantenimiento de sistemas',
          'Backup semanal',
          'Consultoría mensual (2 horas)'
        ],
        popular: false,
        buttonText: 'Empezar Ahora'
      },
      {
        name: 'Profesional',
        price: 'Q4,500',
        period: 'por mes',
        features: [
          'Soporte técnico prioritario',
          'Monitoreo 24/7',
          'Backup diario',
          'Consultoría semanal (4 horas)',
          'Actualizaciones automáticas',
          'Acceso al portal cliente'
        ],
        popular: true,
        buttonText: 'Más Popular'
      },
      {
        name: 'Empresarial',
        price: 'Q8,500',
        period: 'por mes',
        features: [
          'Soporte técnico dedicado',
          'Infraestructura cloud completa',
          'Backup en tiempo real',
          'Consultoría ilimitada',
          'Desarrollo personalizado',
          'SLA garantizado 99.9%',
          'Account manager asignado'
        ],
        popular: false,
        buttonText: 'Máximo Valor'
      }
    ];

    // Datos del equipo
    team = [
      {
        name: 'Ing. Carlos Mendez',
        role: 'Director Técnico',
        specialization: 'Especialista en Arquitectura de Software',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
        experience: '12 años de experiencia'
      },
      {
        name: 'Ing. Ana Rodriguez',
        role: 'Especialista en Cloud',
        specialization: 'Certificada AWS Solutions Architect',
        image: 'https://images.unsplash.com/photo-1494790108755-2616b612b65c?w=300&h=300&fit=crop&crop=face',
        experience: '8 años de experiencia'
      },
      {
        name: 'Ing. Roberto García',
        role: 'Experto en Ciberseguridad',
        specialization: 'Certificado CISSP y CEH',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
        experience: '10 años de experiencia'
      }
    ];

    // Variables para el estado de la aplicación
    isLoading = false;
    showMobileMenu = false;
    currentYear = new Date().getFullYear();

    // Datos de contacto
    contactInfo = {
      address: {
        street: 'Zona 10, Ciudad de Guatemala',
        detail: '6a Avenida 12-25, Edificio Torre Internacional',
        city: 'Guatemala, Guatemala'
      },
      phones: ['+502 2234-5678', '+502 5555-1234'],
      emails: ['info@Simplifika.com.gt', 'ventas@Simplifika.com.gt'],
      schedule: {
        weekdays: 'Lunes a Viernes: 8:00 AM - 6:00 PM',
        saturday: 'Sábados: 9:00 AM - 1:00 PM',
        support: 'Soporte 24/7 disponible'
      }
    };

    // Datos de redes sociales
    socialLinks = [
      {
        name: 'LinkedIn',
        url: 'https://www.linkedin.com/company/Simplifika-gt',
        icon: 'fab fa-linkedin-in'
      },
      {
        name: 'Twitter',
        url: 'https://twitter.com/Simplifika',
        icon: 'fab fa-twitter'
      },
      {
        name: 'Facebook',
        url: 'https://www.facebook.com/Simplifika.gt',
        icon: 'fab fa-facebook-f'
      }
    ];

    constructor(private router: Router) {}

    ngOnInit(): void {
      this.initializeComponent();
      this.setupAnimations();
    }

    // Inicialización del componente
    private initializeComponent(): void {
      // Cualquier lógica de inicialización adicional
      console.log('Simplifika Landing Component inicializado');
    }

    // Configurar animaciones
    private setupAnimations(): void {
      // Configurar intersection observer para animaciones
      if (typeof IntersectionObserver !== 'undefined') {
        const observerOptions = {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-fadeInUp');
            }
          });
        }, observerOptions);

        // Observar elementos después de que se renderice la vista
        setTimeout(() => {
          const elements = document.querySelectorAll('.service-card, .team-card, .pricing-card');
          elements.forEach(el => observer.observe(el));
        }, 100);
      }
    }

    // Navegación suave a secciones
    scrollToSection(sectionId: string): void {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }

    // Navegar al portal de cliente
    goToClientPortal(): void {
        this.router.navigate(['/login']);

    }
    goToLogin(): void {
      this.router.navigate(['/login']);
    }


    // Método para contacto
    contactUs(): void {
      this.scrollToSection('contacto');
    }

    // Método para solicitar consulta
    requestConsultation(): void {
      this.scrollToSection('contacto');
    }

    // Método para mostrar más información de servicios
    showMoreInfo(service: any): void {
      const message = `
        ${service.title}
        
        ${service.description}
        
        Características incluidas:
        ${service.features.map((feature: string) => `• ${feature}`).join('\n')}
        
        ¿Te interesa este servicio? Contáctanos para más información.
      `;
      
      alert(message);
    }

    // Método para obtener las clases CSS dinámicas del grid del equipo
    getTeamGridClasses(): string {
      const teamCount = this.team.length;
      
      if (teamCount === 1) {
        return 'grid grid-cols-1 justify-items-center';
      } else if (teamCount === 2) {
        return 'grid grid-cols-1 md:grid-cols-2 justify-items-center';
      } else if (teamCount === 3) {
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-items-center';
      } else {
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center';
      }
    }

    // Manejar envío del formulario de contacto
    onSubmitContactForm(formData: any): void {
      this.isLoading = true;
      
      // Simular envío de formulario
      setTimeout(() => {
        this.isLoading = false;
        alert('¡Gracias por tu interés! Nos pondremos en contacto contigo dentro de las próximas 24 horas.');
        
        // Aquí puedes agregar la lógica para enviar el formulario a tu backend
        console.log('Datos del formulario:', formData);
      }, 2000);
    }

    // Toggle mobile menu
    toggleMobileMenu(): void {
      this.showMobileMenu = !this.showMobileMenu;
    }

    // Métodos para manejar diferentes tipos de consultas
    requestDevelopmentConsultation(): void {
      this.scrollToSection('contacto');
      // Puedes pre-llenar el formulario con el servicio seleccionado
    }

    requestCloudConsultation(): void {
      this.scrollToSection('contacto');
    }

    requestSecurityConsultation(): void {
      this.scrollToSection('contacto');
    }

    requestITConsultation(): void {
      this.scrollToSection('contacto');
    }

    // Método para seleccionar un plan
    selectPlan(plan: any): void {
      const message = `
        Has seleccionado el plan ${plan.name}
        
        Precio: ${plan.price} ${plan.period}
        
        Características incluidas:
        ${plan.features.map((feature: string) => `• ${feature}`).join('\n')}
        
        ¿Te gustaría proceder con este plan? Nos pondremos en contacto contigo.
      `;
      
      if (confirm(message)) {
        this.scrollToSection('contacto');
      }
    }

    // Método para abrir redes sociales
    openSocialLink(url: string): void {
      window.open(url, '_blank');
    }

    // Método para llamar por teléfono
    callPhone(phone: string): void {
      window.open(`tel:${phone}`, '_self');
    }

    // Método para enviar email
    sendEmail(email: string): void {
      window.open(`mailto:${email}`, '_self');
    }

    // Método para obtener estadísticas animadas
    getStats(): any[] {
      return [
        { value: '200+', label: 'Empresas Transformadas' },
        { value: '500+', label: 'Proyectos Completados' },
        { value: '99.9%', label: 'Uptime Garantizado' },
        { value: '24/7', label: 'Soporte Técnico' }
      ];
    }

    // Método para validar formulario
    validateContactForm(formData: any): boolean {
      if (!formData.name || formData.name.trim() === '') {
        alert('Por favor ingresa tu nombre');
        return false;
      }
      
      if (!formData.email || !this.isValidEmail(formData.email)) {
        alert('Por favor ingresa un email válido');
        return false;
      }
      
      if (!formData.phone || formData.phone.trim() === '') {
        alert('Por favor ingresa tu número de teléfono');
        return false;
      }
      
      if (!formData.message || formData.message.trim() === '') {
        alert('Por favor escribe tu mensaje');
        return false;
      }
      
      return true;
    }

    // Validar formato de email
    private isValidEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    // Método para obtener testimonios de clientes
    getTestimonials(): any[] {
      return [
        {
          name: 'María González',
          company: 'Empresa ABC',
          position: 'Gerente de IT',
          testimonial: 'Simplifika transformó completamente nuestra infraestructura. Ahora somos más eficientes y seguros.',
          rating: 5,
          image: 'https://images.unsplash.com/photo-1494790108755-2616b612b65c?w=100&h=100&fit=crop&crop=face'
        },
        {
          name: 'Carlos Ruiz',
          company: 'StartupXYZ',
          position: 'CEO',
          testimonial: 'El desarrollo de nuestra aplicación móvil superó todas nuestras expectativas. Excelente trabajo.',
          rating: 5,
          image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
        },
        {
          name: 'Ana Morales',
          company: 'Corporación DEF',
          position: 'Directora de Operaciones',
          testimonial: 'Su soporte 24/7 nos ha dado la tranquilidad que necesitábamos. Altamente recomendados.',
          rating: 5,
          image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
        }
      ];
    }

    // Método para obtener preguntas frecuentes
    getFAQs(): any[] {
      return [
        {
          question: '¿Qué incluye el soporte técnico 24/7?',
          answer: 'Nuestro soporte incluye monitoreo continuo de sistemas, resolución de incidencias críticas, mantenimiento preventivo y asistencia técnica por múltiples canales.',
          isOpen: false
        },
        {
          question: '¿Cuánto tiempo toma migrar a la nube?',
          answer: 'El tiempo de migración depende del tamaño y complejidad de su infraestructura. Típicamente va de 2 a 8 semanas, incluyendo planificación, ejecución y pruebas.',
          isOpen: false
        },
        {
          question: '¿Ofrecen capacitación para nuestro personal?',
          answer: 'Sí, incluimos capacitación personalizada para su equipo en todas nuestras implementaciones. También ofrecemos programas de capacitación continua.',
          isOpen: false
        },
        {
          question: '¿Qué garantías ofrecen en sus servicios?',
          answer: 'Ofrecemos SLA del 99.9% de uptime, garantía de satisfacción en proyectos de desarrollo y soporte técnico garantizado según el plan contratado.',
          isOpen: false
        }
      ];
    }

    // Toggle FAQ
    toggleFAQ(index: number): void {
      const faqs = this.getFAQs();
      faqs[index].isOpen = !faqs[index].isOpen;
    }

    // Método para obtener certificaciones
    getCertifications(): any[] {
      return [
        {
          name: 'AWS Partner',
          image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=60&fit=crop',
          description: 'Amazon Web Services Certified Partner'
        },
        {
          name: 'Microsoft Azure',
          image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=60&fit=crop',
          description: 'Microsoft Azure Solutions Partner'
        },
        {
          name: 'Google Cloud',
          image: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100&h=60&fit=crop',
          description: 'Google Cloud Platform Partner'
        },
        {
          name: 'ISO 27001',
          image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=100&h=60&fit=crop',
          description: 'Gestión de Seguridad de la Información'
        }
      ];
    }

    // Método para calcular ahorros estimados
    calculateSavings(currentCosts: number): any {
      const savings = {
        monthly: Math.round(currentCosts * 0.3), // 30% de ahorro estimado
        yearly: Math.round(currentCosts * 0.3 * 12),
        roi: '300%', // ROI estimado
        paybackMonths: 6
      };
      return savings;
    }

    // Método para programar demo
    scheduleDemonstration(): void {
      const message = `
        ¿Te gustaría programar una demostración personalizada?
        
        Nuestro equipo puede mostrarte:
        • Cómo nuestras soluciones se adaptan a tu empresa
        • Casos de éxito similares a tu industria
        • Estimación de costos y beneficios
        • Roadmap de implementación
        
        La demostración es completamente gratuita y sin compromiso.
      `;
      
      if (confirm(message)) {
        this.scrollToSection('contacto');
      }
    }

    // Método para descargar caso de estudio
    downloadCaseStudy(industry: string): void {
      // Simular descarga de PDF
      alert(`Descargando caso de estudio para la industria: ${industry}`);
      
      // Aquí puedes implementar la lógica real de descarga
      // window.open(`/assets/case-studies/${industry}.pdf`, '_blank');
    }

    // Método para suscribirse al newsletter
    subscribeNewsletter(email: string): void {
      if (!this.isValidEmail(email)) {
        alert('Por favor ingresa un email válido');
        return;
      }
      
      // Simular suscripción
      alert('¡Gracias por suscribirte! Recibirás nuestras actualizaciones tecnológicas mensuales.');
      
      // Aquí puedes implementar la lógica real de suscripción
      console.log('Nuevo suscriptor:', email);
    }

    // Método para obtener horarios de atención
    getBusinessHours(): any {
      return {
        monday: { open: '08:00', close: '18:00', isOpen: true },
        tuesday: { open: '08:00', close: '18:00', isOpen: true },
        wednesday: { open: '08:00', close: '18:00', isOpen: true },
        thursday: { open: '08:00', close: '18:00', isOpen: true },
        friday: { open: '08:00', close: '18:00', isOpen: true },
        saturday: { open: '09:00', close: '13:00', isOpen: true },
        sunday: { open: '00:00', close: '00:00', isOpen: false }
      };
    }

    // Método para verificar si está abierto ahora
    isCurrentlyOpen(): boolean {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentTime = now.getHours() * 100 + now.getMinutes(); // Format: HHMM
      
      const businessHours = this.getBusinessHours();
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todaySchedule = businessHours[days[currentDay]];
      
      if (!todaySchedule.isOpen) return false;
      
      const openTime = parseInt(todaySchedule.open.replace(':', ''));
      const closeTime = parseInt(todaySchedule.close.replace(':', ''));
      
      return currentTime >= openTime && currentTime <= closeTime;
    }

    // Método para obtener industrias que servimos
    getIndustries(): any[] {
      return [
        {
          name: 'Finanzas y Banca',
          icon: 'fas fa-university',
          description: 'Soluciones seguras para el sector financiero'
        },
        {
          name: 'Healthcare',
          icon: 'fas fa-heartbeat',
          description: 'Tecnología para el cuidado de la salud'
        },
        {
          name: 'Retail y E-commerce',
          icon: 'fas fa-shopping-cart',
          description: 'Plataformas de venta online y gestión'
        },
        {
          name: 'Educación',
          icon: 'fas fa-graduation-cap',
          description: 'Sistemas educativos y e-learning'
        },
        {
          name: 'Manufactura',
          icon: 'fas fa-industry',
          description: 'Automatización y control de procesos'
        },
        {
          name: 'Gobierno',
          icon: 'fas fa-landmark',
          description: 'Soluciones para el sector público'
        }
      ];
    }

    // Método para obtener tecnologías que usamos
    getTechnologies(): any[] {
      return [
        { name: 'Angular', icon: 'fab fa-angular', category: 'Frontend' },
        { name: 'React', icon: 'fab fa-react', category: 'Frontend' },
        { name: 'Node.js', icon: 'fab fa-node-js', category: 'Backend' },
        { name: 'Python', icon: 'fab fa-python', category: 'Backend' },
        { name: 'AWS', icon: 'fab fa-aws', category: 'Cloud' },
        { name: 'Docker', icon: 'fab fa-docker', category: 'DevOps' },
        { name: 'Kubernetes', icon: 'fas fa-dharmachakra', category: 'DevOps' },
        { name: 'MongoDB', icon: 'fas fa-database', category: 'Database' }
      ];
    }

    // Método para filtrar testimonios por rating
    getFilteredTestimonials(minRating: number = 4): any[] {
      return this.getTestimonials().filter(testimonial => testimonial.rating >= minRating);
    }

    // Método de limpieza al destruir el componente
    ngOnDestroy(): void {
      // Limpiar observadores y listeners si es necesario
      console.log('Simplifika Landing Component destruido');
    }

    // Método para trackear eventos de Google Analytics (si está implementado)
    trackEvent(action: string, category: string, label?: string): void {
      // Implementar tracking de eventos si tienes Google Analytics
      console.log(`Tracking event - Action: ${action}, Category: ${category}, Label: ${label}`);
      
      // Ejemplo de implementación con gtag:
      // if (typeof gtag !== 'undefined') {
      //   gtag('event', action, {
      //     event_category: category,
      //     event_label: label
      //   });
      // }
    }

    // Método para obtener el próximo webinar
    getNextWebinar(): any {
      return {
        title: 'Transformación Digital para PYMEs',
        date: '2025-08-15',
        time: '15:00',
        duration: '60 minutos',
        presenter: 'Ing. Carlos Mendez',
        topics: [
          'Estrategias de digitalización',
          'Herramientas esenciales',
          'Casos de éxito',
          'Sesión de Q&A'
        ],
        registrationUrl: '#contacto'
      };
    }

    // Método para registrarse al webinar
    registerWebinar(): void {
      const webinar = this.getNextWebinar();
      const message = `
        Webinar: ${webinar.title}
        Fecha: ${webinar.date} a las ${webinar.time}
        Duración: ${webinar.duration}
        Presentador: ${webinar.presenter}
        
        ¿Te gustaría registrarte? Es completamente gratuito.
      `;
      
      if (confirm(message)) {
        this.scrollToSection('contacto');
        this.trackEvent('webinar_registration', 'engagement', webinar.title);
      }
    }
  }