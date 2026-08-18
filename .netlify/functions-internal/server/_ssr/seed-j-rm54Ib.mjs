import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { s as supabase } from "./client-CZxeSKt5.mjs";
import { u as useAuth } from "./router-rHJT1VjN.mjs";
import "../_libs/sonner.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/lucide-react.mjs";
const projects = [{
  title: "HornBill",
  slug: "hornbill",
  tagline: "AI-powered drone for reforestation",
  category: "Hardware",
  tech_stack: ["Python", "TensorFlow", "Arduino", "DroneKit"],
  github_url: "https://github.com/BENi-Aditya",
  demo_url: "https://devpost.com/BENi-Aditya",
  cover_url: "/projects/Drone.webp",
  description: "HornBill is an AI-powered autonomous drone system designed to tackle one of the fastest-growing environmental crises: deforestation. Instead of relying on slow and labor-intensive manual plantation efforts, HornBill deploys bioengineered seed bombs from the air, enabling rapid large-scale reforestation across difficult terrains. Combining drone navigation, intelligent targeting algorithms, and sustainable ecological design, the project transforms a drone into a flying forest restoration platform capable of reaching areas where human intervention is nearly impossible."
}, {
  title: "Robot Car",
  slug: "robot-car",
  tagline: "Bluetooth-controlled robotic vehicle",
  category: "Hardware",
  tech_stack: ["Arduino", "C++", "Bluetooth", "Electronics"],
  github_url: "https://github.com/BENi-Aditya",
  demo_url: null,
  cover_url: "/projects/satellite.webp",
  description: "Robot Car is a Bluetooth-controlled robotic vehicle built using Arduino and custom electronics, designed as a foundation for autonomous robotics experimentation. Equipped with programmable movement controls and NeoPixel lighting effects, the project demonstrates embedded systems development, wireless communication, sensor integration, and real-time hardware control. Beyond functioning as a remote-controlled vehicle, it serves as a scalable robotics platform for future autonomous navigation and AI-based decision-making systems."
}, {
  title: "VibeCode",
  slug: "vibecode",
  tagline: "Cloud-native AI development environment",
  category: "Software",
  tech_stack: ["React", "TypeScript", "Node.js", "AI", "Cloud"],
  github_url: null,
  demo_url: "https://devpost.com/BENi-Aditya",
  cover_url: "/projects/ai-talkbot.webp",
  description: "VibeCode is a cloud-native AI development environment that merges ideation, learning, coding, and deployment into a unified workflow. Rather than forcing developers to switch between multiple tools, VibeCode provides dedicated AI-powered workspaces that assist with brainstorming, project planning, environment setup, code generation, and debugging. The platform is designed to reduce friction between an idea and a working product, creating a streamlined ecosystem where developers can build, learn, and iterate without leaving the workspace."
}, {
  title: "VitalScans.AI",
  slug: "vitalscans-ai",
  tagline: "AI-assisted medical imaging platform",
  category: "AI/ML",
  tech_stack: ["Python", "PyTorch", "Computer Vision", "Medical Imaging"],
  github_url: null,
  demo_url: "https://devpost.com/BENi-Aditya",
  cover_url: "/projects/aditya.webp",
  description: "VitalScans.AI is an AI-assisted medical imaging platform developed to make early disease detection more accessible. Using advanced computer vision models trained on radiological data, the system analyzes X-rays and MRI scans to identify conditions such as pneumonia, tuberculosis, fractures, and other abnormalities. The platform highlights affected regions, provides confidence scores, and enables users to understand diagnostic results through an interactive interface. By bringing intelligent medical screening closer to patients, VitalScans.AI aims to support faster diagnosis and improve healthcare accessibility, particularly in underserved regions."
}, {
  title: "BlindSight",
  slug: "blindsight",
  tagline: "AI-powered wearable for visually impaired",
  category: "Hardware",
  tech_stack: ["Raspberry Pi", "Python", "YOLOv8", "Computer Vision"],
  github_url: "https://github.com/BENi-Aditya",
  demo_url: null,
  cover_url: "/projects/Blindsight.webp",
  description: "BlindSight is an AI-powered wearable accessibility system built to give visually impaired individuals greater independence while navigating the world. Powered by a Raspberry Pi and advanced computer vision models, the device uses YOLOv8 object detection, monocular depth estimation, and real-time voice feedback to identify obstacles, recognize surroundings, estimate distances, and answer spoken queries. Instead of forcing users to rely solely on traditional mobility tools, BlindSight acts as an intelligent companion that continuously interprets the environment and communicates crucial information through natural audio responses. Designed as a lightweight wearable platform, the project combines accessibility, embedded AI, and human-centered engineering to bridge the gap between perception and mobility. Through scene understanding, navigation assistance, object recognition, and contextual awareness, BlindSight transforms computer vision research into a practical tool that can help users move through unfamiliar environments with greater confidence and safety."
}, {
  title: "Drone Brain",
  slug: "drone-brain",
  tagline: "Intelligent aerial robotics system",
  category: "AI/ML",
  tech_stack: ["Python", "ROS", "Computer Vision", "Sensor Fusion"],
  github_url: "https://github.com/BENi-Aditya",
  demo_url: null,
  cover_url: "/projects/Jatayu.webp",
  description: "Drone Brain is an intelligent aerial robotics system focused on autonomous environmental awareness and decision-making. The project combines computer vision, sensor fusion, and AI-driven navigation to allow drones to interpret their surroundings in real time, detect objects of interest, and execute tasks with minimal human intervention. Designed as a foundation for future applications in environmental monitoring, surveillance, search-and-rescue operations, and smart agriculture, Drone Brain transforms a conventional drone into a flying AI agent capable of understanding and responding to the world around it."
}];
const buildLogs = [{
  body: "just got the drone navigation working! it can avoid trees now 🌳",
  image_url: "/projects/Drone.webp"
}, {
  body: "added the seed bombing mechanism - test drop successful! 🚀",
  image_url: "/projects/Payload.webp"
}, {
  body: "YOLO model is detecting open areas for planting with 94% accuracy 🤖",
  image_url: null
}, {
  body: "blindsight prototype can now detect stairs and curbs! 🦯",
  image_url: "/projects/Blindsight.webp"
}, {
  body: "vibecode AI assistant just wrote 200 lines of working code for me 🎉",
  image_url: "/projects/ai-talkbot.webp"
}];
const collabPosts = [{
  title: "Looking for a frontend dev for HornBill dashboard",
  description: "Need someone to build a real-time dashboard for monitoring drone missions. React/Next.js experience preferred.",
  role_needed: "Frontend Developer",
  tech_tags: ["React", "Next.js", "WebSocket", "Leaflet"]
}, {
  title: "ML engineer to improve BlindSight accuracy",
  description: "We need better depth estimation and object detection models. Experience with YOLO and monocular depth a plus!",
  role_needed: "ML Engineer",
  tech_tags: ["Python", "YOLO", "Computer Vision", "TensorFlow"]
}, {
  title: "Hackathon team forming - let's build something crazy",
  description: "Looking for designers and devs for the next big hackathon. Let's win this! 🏆",
  role_needed: "Designer / Dev",
  tech_tags: ["Design", "React", "Python", "AI"]
}];
function SeedPage() {
  const {
    user
  } = useAuth();
  const [status, setStatus] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const seedData = async () => {
    if (!user) return alert("Sign in first!");
    setLoading(true);
    setStatus("Deleting old data...");
    try {
      await supabase.from("build_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("collab_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("collab_posts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("comment_likes").delete().neq("comment_id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("comments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("follows").delete().neq("follower_id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("likes").delete().neq("user_id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("saves").delete().neq("user_id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("notifications").delete().neq("user_id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("project_media").delete().neq("project_id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("projects").delete().neq("owner_id", "00000000-0000-0000-0000-000000000000");
      setStatus("Inserting projects...");
      const insertedProjects = [];
      for (const project of projects) {
        const {
          data,
          error
        } = await supabase.from("projects").insert({
          ...project,
          owner_id: user.id,
          visibility: "public",
          like_count: Math.floor(Math.random() * 100) + 10,
          comment_count: Math.floor(Math.random() * 20),
          view_count: Math.floor(Math.random() * 500)
        }).select();
        if (data) insertedProjects.push(...data);
      }
      setStatus("Inserting build logs...");
      for (let i = 0; i < buildLogs.length; i++) {
        const log = buildLogs[i];
        const project = insertedProjects[i % insertedProjects.length];
        await supabase.from("build_logs").insert({
          body: log.body,
          image_url: log.image_url,
          user_id: user.id,
          project_id: project.id
        });
      }
      setStatus("Inserting collab posts...");
      for (const post of collabPosts) {
        await supabase.from("collab_posts").insert({
          ...post,
          user_id: user.id,
          is_open: true
        });
      }
      setStatus("Done! ✨");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (e) {
      console.error(e);
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md mx-auto brutal-card p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-black text-3xl mb-4", children: "Seed Data" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mb-6", children: "This will delete all existing data and populate your projects." }),
    status && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 p-4 bg-card border-2 border-white/20 font-mono", children: status }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: seedData, disabled: loading, className: "brutal-btn w-full justify-center", children: loading ? "Seeding..." : "Seed Database" })
  ] }) });
}
export {
  SeedPage as component
};
