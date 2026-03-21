import { IconGithub, IconXTwitter } from 'nucleo-social-media';
import { IconGlobePointerFillDuo18 } from 'nucleo-ui-essential-fill-duo-18';

const links = [
    {
        name: "Twitter",
        url: "https://x.com/roohbuilds",
        label: "@roohbuilds",
        Icon: IconXTwitter,
    },
    {
        name: "GitHub",
        url: "https://github.com/CoDesign-Spa27",
        label: "CoDesign-Spa27",
        Icon: IconGithub,
    },
    {
        name: "Portfolio",
        url: "https://sandeepsingh.me",
        label: "Portfolio",
        Icon: IconGlobePointerFillDuo18,
    },
];

const Footer = () => {
    return (
        <footer className="w-full py-4 px-4 flex justify-between items-center border-t bg-background/70">
            <div className="flex flex-wrap justify-center gap-6 items-center">
                {links.map(({ name, url, label, Icon }) => (
                    <a
                        key={name}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg transition hover:bg-accent hover:text-foreground text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        aria-label={name}
                    >
                        <Icon className="size-5" />
                        <span className="font-medium">{label}</span>
                    </a>
                ))}
            </div>
            <div className="text-xs text-muted-foreground/70 text-center">
                Built by <span className="font-semibold text-foreground">@roohbuilds</span> &mdash; &copy; {new Date().getFullYear()}
            </div>
        </footer>
    );
};

export default Footer;