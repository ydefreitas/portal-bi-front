import React from 'react';

const Footer = () => {
    return (
        <footer className="mt-auto mt-12 border-t bg-card/50 backdrop-blur-sm p-4 w-full">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">

                {/* Left Side: Contact Info */}
                <div className="flex flex-col items-center md:items-start space-y-0.5">
                    <p className="font-medium text-foreground/70">Soporte y Contacto</p>
                    <p>Para contactar con los administradores escribir a <span className="text-primary font-medium italic">Lista BI</span> por correo.</p>
                </div>

                {/* Right Side: Dev, Version and Logo */}
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center md:items-end space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground/60 text-[10px] uppercase tracking-wider">v1.1.0</span>
                            <div className="h-3 w-px bg-border hidden md:block" />
                            <p className="text-[10px] font-medium opacity-70">
                                Dev by Jose Sebastiano
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
                        <span className="font-bold text-foreground/50 text-[11px] hidden sm:block">Portal de Datos</span>
                        <img
                            src="/lovable-uploads/c61755bb-3089-411c-9aa2-614ec102b621.png"
                            alt="Portal de Datos"
                            className="h-5 w-5"
                        />
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
