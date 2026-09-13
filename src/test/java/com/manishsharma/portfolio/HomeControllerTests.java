package com.manishsharma.portfolio;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

@WebMvcTest(HomeController.class)
class HomeControllerTests {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void homeRendersThymeleafTemplate() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(view().name("index"))
                .andExpect(model().attribute("activePage", "home"))
                .andExpect(content().string(containsString("SEO Specialist Turned")))
                .andExpect(content().string(containsString("Dual-Discipline Capabilities")))
                .andExpect(content().string(containsString("/css/style.css")))
                .andExpect(content().string(containsString("Let's Work Together")));
    }

    @Test
    void homeStylesAreServed() throws Exception {
        mockMvc.perform(get("/css/style.css"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/css"));
    }

    @Test
    void sharedFragmentsRenderWithHomeActiveAndPageDestinations() throws Exception {
        String html = mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        assertThat(html).doesNotContain("th:replace", "th:fragment", "th:href");
        assertThat(html).contains("aria-label=\"Toggle navigation menu\"", "aria-controls=\"navLinks\"");

        String header = html.substring(html.indexOf("<nav "), html.indexOf("</nav>"));
        String footer = html.substring(html.indexOf("<footer "), html.indexOf("</footer>"));
        String[][] navigation = {
                {"/", "Home"}, {"/about", "About"}, {"/services", "Services"},
                {"/resources", "Resources"}, {"/contact", "Contact"}
        };
        for (String[] link : navigation) {
            String anchor = "<a\\b[^>]*href=\"" + link[0] + "\"[^>]*>" + link[1] + "</a>";
            assertThat(header).containsPattern(anchor);
            assertThat(footer).containsPattern(anchor);
        }

        assertThat(header).containsPattern(
                "<a\\b(?=[^>]*href=\"/\")(?=[^>]*class=\"nav-link active\")"
                        + "(?=[^>]*aria-current=\"page\")[^>]*>Home</a>");
        assertThat(header.split("aria-current=\"page\"", -1)).hasSize(2);
        assertThat(header).containsPattern("<a\\b[^>]*href=\"/contact\"[^>]*>Contact Me</a>");
        assertThat(footer).contains("MANISH SHARMA", "Social Ecosystem", "Twitter / X",
                "2026 Manish Sharma. All rights reserved.", "Privacy Policy", "Terms of Service");
    }
}
