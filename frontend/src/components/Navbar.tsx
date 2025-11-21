import { Link } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import {
  ImageIcon,
  FileTextIcon,
  GlobeIcon,
  MenuIcon,
  ExternalLinkIcon,
  UserIcon,
  LogOutIcon,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
      title: "Start",
      url: "/",
    },
    {
      title: "Editors",
      url: "#",
      items: [
        {
          title: "Image Editor",
          description: "Redigera och bearbeta bilder med CarCutter",
          icon: <ImageIcon className="size-5 shrink-0" />,
          url: "/image-editor",
        },
        {
          title: "Data Editor",
          description: "Redigera och hantera bilddata och metadata",
          icon: <FileTextIcon className="size-5 shrink-0" />,
          url: "/data-editor",
        },
        {
          title: "Scrape Editor",
          description: "Skrapa och ladda ner bilder från webben",
          icon: <GlobeIcon className="size-5 shrink-0" />,
          url: "/scrape-editor",
        },
      ],
    },
    {
      title: "External Tools",
      url: "#",
      items: [
        {
          title: "AutoScout Tool",
          description: "Generera länkar för AutoScout24",
          icon: <ExternalLinkIcon className="size-5 shrink-0" />,
          url: "https://auto-scout-linker-bilalovai.replit.app/cars",
          external: true,
        },
      ],
    },
  ];

  const logo = {
    url: "/",
    src: "/company_logo.svg",
    alt: "EuroMotors AG Logo",
    title: "EuroMotors AG",
  };

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Desktop Menu */}
        <nav className="hidden items-center justify-between py-4 lg:flex">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to={logo.url} className="flex items-center gap-2">
              <img
                src={logo.src}
                className="max-h-8 dark:invert"
                alt={logo.alt}
              />
              <span className="text-lg font-semibold tracking-tighter">
                {logo.title}
              </span>
            </Link>

            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => renderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

          {/* User Profile Dropdown */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
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
            {/* Logo */}
            <Link to={logo.url} className="flex items-center gap-2">
              <img
                src={logo.src}
                className="max-h-8 dark:invert"
                alt={logo.alt}
              />
            </Link>

            <div className="flex items-center gap-2">
              {/* User Profile for Mobile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
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

              {/* Mobile Menu Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MenuIcon className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>
                      <Link to={logo.url} className="flex items-center gap-2">
                        <img
                          src={logo.src}
                          className="max-h-8 dark:invert"
                          alt={logo.alt}
                        />
                        <span className="text-lg font-semibold">
                          {logo.title}
                        </span>
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
