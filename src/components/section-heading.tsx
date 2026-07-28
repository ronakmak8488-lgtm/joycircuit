import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";

type SectionHeadingProps = {
  id: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
};

export function SectionHeading({ id, title, description, href, linkLabel = "See all" }: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div>
        <h2 id={id}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {href ? <Link className="text-link" href={href}>{linkLabel}<ArrowRightIcon size={17} /></Link> : null}
    </div>
  );
}
