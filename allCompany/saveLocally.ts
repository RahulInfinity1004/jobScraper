
import fs from 'fs';
// import data from './next_1800.json';

import json2md from "json2md";

var json2xls = require('json2xls');

interface ITech {
    frontend: string[],
    backend: string[]
}
interface Ifunding {
    [key: string]: string
}

interface CompanyDetails {
    companyName: string;
    work_description: string;
    description: string;
    location: string;
    // industry?: string;
    companySize: string;
    summary: string;
    logo: string;
    socialLinks: string[];
    technologies: ITech,
    locationtype: string;
    fundingDetails: Ifunding
}

interface JsonData {
  data: CompanyDetails[];
}

import data from './next_1800.json';
const jsonData = data as JsonData;

function saveLocally(allCurrentJobs: Array<CompanyDetails>) {
    // console.log({save: allCurrentJobs});

    const xls = json2xls(allCurrentJobs);
    const mdData = json2md(
        allCurrentJobs.map((company, i) => ({
          table: {
            headers: ['Company', 'Logo', 'Company Size', 'Location', 'Summary'],
            rows: [
              [
                `${i + 1}. ${company.companyName}`,
                `![Logo](${company.logo})`,
                company.companySize,
                company.location,
                company.summary
              ]
            ]
          }
        }))
      );
    
      // const mdData = json2md(
      //   allCurrentJobs.map((company, i) => ({
      //     h2: `${i + 1}. ${company.companyName}`,
      //   //   img: company.logo,
      //     p: [
      //       `**Company Size**: ${company.companySize}`,
      //       `**Location**: ${company.location}`,
      //       `**Summary**: ${company.summary}`,
      //       `**Social Links**: ${company.socialLinks.join(', ')}`
      //     ],
      //     table: {
      //       headers: ['Frontend Technologies', 'Backend Technologies'],
      //       rows: [
      //         [
      //           company.technologies.frontend.join(', '),
      //           company.technologies.backend.join(', ')
      //         ]
      //       ]
      //     }
      //   }))
      // );
    
      const mdData1 = json2md(
        allCurrentJobs.map((company: CompanyDetails, i: number) => {
          // Social Media icons mapping
          const socialMediaIcons: { [key: string]: string } = {
            website: "🌐 Website",
            twitter: "🐦 Twitter",
            facebook: "📘 Facebook",
            linkedin: "🔗 LinkedIn"
          };
      
          // Filter and map social links to include only required ones
          const socialMediaLinks = company.socialLinks
            .filter((link) => {
              return (
                link.includes("linkedin.com") ||
                link.includes("twitter.com") ||
                link.includes("facebook.com") ||
                link.includes(company.companyName.toLowerCase()) // Generic website match
              );
            })
            .map((link) => {
              if (link.includes("linkedin.com")) {
                return `- **${socialMediaIcons.linkedin}**: [LinkedIn](${link})`;
              }
              if (link.includes("twitter.com")) {
                return `- **${socialMediaIcons.twitter}**: [Twitter](${link})`;
              }
              if (link.includes("facebook.com")) {
                return `- **${socialMediaIcons.facebook}**: [Facebook](${link})`;
              }
              if (link.includes(company.companyName.toLowerCase())) {
                return `- **${socialMediaIcons.website}**: [Website](${link})`;
              }
              return null;
            })
            .filter(Boolean)
            .join("\n");
      
          return {
            h2: `${i + 1}. ${company.companyName}`,
            p: [
              `**Location**: ${company.location}`,
              `**Location Type**: ${company.locationtype}`,
              `**Company Size**: ${company.companySize}`,
              `**Work Description**: ${company.work_description}`,
              `**Summary**: ${company.summary}`,
              `**Technologies**:`,
              `- Frontend: ${company.technologies.frontend.join(", ")}`,
              `- Backend: ${company.technologies.backend.join(", ")}`,
              `**Funding Details**:`,
              Object.entries(company.fundingDetails)
                .map(([key, value]) => `- ${key}: ${value}`)
                .join("\n"),
              `**Social Media Links**:\n${socialMediaLinks}`
            ].join("\n\n"),
            img: {
              source: company.logo,
              alt: `${company.companyName} Logo`,
              title: `${company.companyName} Logo`,
              width: "100",
              height: "100"
            }
          };
        })
      );
      const mdData2 = json2md(
        allCurrentJobs.map((company: CompanyDetails, i: number) => ({
          table: {
            headers: [
              'Index', 
              'Company', 
              'Logo', 
              'Location', 
              'Size', 
              'Location Type', 
              'Work Description', 
              'Technologies', 
              'Funding Details'
            ],
            rows: [
              [
                `${i + 1}`, // Index
                company.companyName, // Company Name
                `<img src="${company.logo}" alt="Logo" width="100" height="100" />`, // Consistent logo size
                company.location, // Location
                company.companySize, // Company Size
                company.locationtype, // Location Type
                company.work_description, // Work Description
                `Frontend: ${company.technologies.frontend.join(', ')}\nBackend: ${company.technologies.backend.join(', ')}`, // Technologies
                Object.entries(company.fundingDetails)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ') // Funding Details as a string
              ]
            ]
          }
        }))
      );
      
      
    const json_data = JSON.stringify(allCurrentJobs);
    // console.log({json_data});
    const date = new Date().toLocaleDateString().replaceAll('/', '-');
    // fs.writeFileSync(`allCompany/company_${date}_post.json`, json_data);
    fs.writeFileSync(`allCompany/demo_company_${date}_post.md`, mdData);
    fs.writeFileSync(`allCompany/demo_company_${date}_post1.md`, mdData1);
    fs.writeFileSync(`allCompany/demo_company_${date}_post2.md`, mdData2);
    // fs.writeFileSync(`allCompany/company_${date}_post.xlsx`, xls, 'binary');
}
saveLocally(jsonData.data);
// x();