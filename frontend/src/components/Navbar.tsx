import { Link } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import {
  ImageIcon,
  GlobeIcon,
  MenuIcon,
  ExternalLinkIcon,
  UserIcon,
  LogOutIcon,
  FileDownIcon,
  Grip,
  MessageSquare,
  Home,
  FileCode,
} from "lucide-react";
import companyLogo from "@/assets/company_logo.svg";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/Button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/utils/cn";

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  external?: boolean;
  items?: MenuItem[];
}

const Navbar = () => {
  const { user } = useUser();
  const { signOut } = useClerk();

  const getUserInitial = () => {
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user?.emailAddresses[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return user?.emailAddresses[0]?.emailAddress || "User";
  };

  const handleSignOut = () => {
    signOut();
  };

  const menu: MenuItem[] = [
    {
      title: "Editors",
      url: "#",
      items: [
        {
          title: "Image Editor",
          description: "Edit and process images with CarCutter",
          icon: <ImageIcon className="size-5 shrink-0" />,
          url: "/image-editor",
        },
        {
          title: "JSON Editor",
          description: "Edit and validate car JSON files",
          icon: <FileCode className="size-5 shrink-0" />,
          url: "/json-editor",
        },
        {
          title: "Scrape Editor",
          description: "Scrape images and data from the web",
          icon: <GlobeIcon className="size-5 shrink-0" />,
          url: "/scrape-editor",
        },
      ],
    },
    {
      title: "Converters",
      url: "#",
      items: [
        {
          title: "PDF Convert",
          description: "Convert PDF files to other formats",
          icon: <FileDownIcon className="size-5 shrink-0" />,
          url: "/converters",
        },
      ],
    },
    {
      title: "External Tools",
      url: "#",
      items: [
        {
          title: "AutoScout Tool",
          description: "Generate links for AutoScout24",
          icon: <ExternalLinkIcon className="size-5 shrink-0" />,
          url: "https://ai.eumotors.ch/cars",
          external: true,
        },
      ],
    },
  ];

  const logo = {
    url: "/",
    src: companyLogo,
    alt: "EuroMotors AG",
  };

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Desktop Menu */}
        <nav className="hidden items-center justify-between py-4 lg:flex">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to={logo.url} className="flex items-center">
              <img
                src={logo.src}
                className="h-10 w-auto brightness-0 dark:brightness-100"
                alt={logo.alt}
              />
            </Link>

            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => renderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

          {/* External Tools Dropdown & User Profile Dropdown */}
          <div className="flex items-center gap-2">
            {/* Grip Dropdown for External Tools */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-12 w-12 p-0 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Grip className="h-6 w-6" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 p-4" align="end" forceMount>
                <div className="grid grid-cols-4 gap-3">
                  <a
                    href="https://eumotors.ch"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer">
                    <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <Home className="h-7 w-7 text-blue-500" />
                    </div>
                    <span className="text-xs text-center text-foreground leading-tight">
                      Eumotors Website
                    </span>
                  </a>
                  <a
                    href="https://eumotors.ch"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer">
                    <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <ExternalLinkIcon className="h-7 w-7 text-purple-500" />
                    </div>
                    <span className="text-xs text-center text-foreground leading-tight">
                      Eumotors Hub
                    </span>
                  </a>
                  <a
                    href="https://drive.google.com/file/d/13bfbljPRq3zzcPbNOIWFyEJokt5OLIXf/view?usp=drive_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer">
                    <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                      <FileCode className="h-7 w-7 text-orange-500" />
                    </div>
                    <span className="text-xs text-center text-foreground leading-tight">
                      Eumotors Extension
                    </span>
                  </a>
                  <a
                    href="https://chat.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer">
                    <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                      <MessageSquare className="h-7 w-7 text-green-500" />
                    </div>
                    <span className="text-xs text-center text-foreground leading-tight">
                      Google Chat
                    </span>
                  </a>
                  {/* Add more external tools here - they will automatically wrap to next row */}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      {getUserInitial()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {getUserName()}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.emailAddresses[0]?.emailAddress}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between py-4">
            {/* Mobile Menu Sheet - Moved to left */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <MenuIcon className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <Link to={logo.url} className="flex items-center">
                      <img
                        src={logo.src}
                        className="h-10 w-auto brightness-0 dark:brightness-100"
                        alt={logo.alt}
                      />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 p-4">
                  <Accordion
                    type="single"
                    collapsible
                    className="flex w-full flex-col gap-4">
                    {menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              {/* Grip Dropdown for Mobile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-12 w-12 p-0 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Grip className="h-6 w-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-80 p-4"
                  align="end"
                  alignOffset={-24}
                  forceMount>
                  <div className="grid grid-cols-4 gap-3">
                    <a
                      href="https://eumotors.ch"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer">
                      <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <Home className="h-7 w-7 text-blue-500" />
                      </div>
                      <span className="text-xs text-center text-foreground leading-tight">
                        Eumotors Website
                      </span>
                    </a>
                    <a
                      href="https://auto-scout-linker-bilalovai.replit.app/cars"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer">
                      <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                        <ExternalLinkIcon className="h-7 w-7 text-purple-500" />
                      </div>
                      <span className="text-xs text-center text-foreground leading-tight">
                        Eumotors Hub
                      </span>
                    </a>
                    <a
                      href="https://drive.google.com/file/d/13bfbljPRq3zzcPbNOIWFyEJokt5OLIXf/view?usp=drive_link"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer">
                      <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                        <FileCode className="h-7 w-7 text-orange-500" />
                      </div>
                      <span className="text-xs text-center text-foreground leading-tight">
                        Eumotors Extension
                      </span>
                    </a>
                    <a
                      href="https://chat.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer">
                      <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                        <MessageSquare className="h-7 w-7 text-green-500" />
                      </div>
                      <span className="text-xs text-center text-foreground leading-tight">
                        Google Chat
                      </span>
                    </a>
                    {/* Add more external tools here - they will automatically wrap to next row */}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Profile for Mobile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        {getUserInitial()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {getUserName()}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.emailAddresses[0]?.emailAddress}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const renderMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent className="bg-popover text-popover-foreground">
          {item.items.map((subItem) => (
            <NavigationMenuLink asChild key={subItem.title} className="w-80">
              <SubMenuLink item={subItem} />
            </NavigationMenuLink>
          ))}
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink asChild>
        <Link
          to={item.url}
          className={cn(
            "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
          )}>
          {item.title}
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="py-0 text-md font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          <div className="flex flex-col gap-2">
            {item.items.map((subItem) => (
              <SubMenuLink key={subItem.title} item={subItem} mobile />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <Link
      key={item.title}
      to={item.url}
      className="text-md font-semibold hover:text-primary transition-colors">
      {item.title}
    </Link>
  );
};

const SubMenuLink = ({
  item,
  mobile = false,
}: {
  item: MenuItem;
  mobile?: boolean;
}) => {
  const content = (
    <div
      className={cn(
        "flex min-w-80 select-none flex-row gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors",
        mobile
          ? "hover:bg-accent hover:text-accent-foreground"
          : "hover:bg-accent hover:text-accent-foreground"
      )}>
      <div className="text-foreground">{item.icon}</div>
      <div>
        <div className="text-sm font-semibold">{item.title}</div>
        {item.description && (
          <p className="text-muted-foreground text-sm leading-snug">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );

  if (item.external) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(mobile && "block")}>
        {content}
      </a>
    );
  }

  return (
    <Link to={item.url} className={cn(mobile && "block")}>
      {content}
    </Link>
  );
};

export default Navbar;
