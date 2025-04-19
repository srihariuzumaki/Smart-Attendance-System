import { Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-4 px-6 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-center gap-2 md:flex-row md:justify-between text-sm text-muted-foreground">
        <p>
          © {currentYear} Smart Attendance System. All rights reserved.
        </p>
        <a
          href="https://www.linkedin.com/in/srihari-kulkarni-0203b1223/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-medium hover:text-primary transition-colors"
        >
          Made with <Heart className="h-4 w-4 text-red-500" /> by Srihari, CSE, PDIT, 2022-Batch
        </a>
      </div>
    </footer>
  );
};

export default Footer; 