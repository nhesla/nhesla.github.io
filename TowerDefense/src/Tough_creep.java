import java.awt.*;  
import java.applet.Applet;  
import java.util.Random; 

public class Tough_creep extends Creep
{ 
    public Tough_creep(int x, int y, int h, int s, int d) 
    {
		super(x, y, h, s, d);
	}	
		
	public Tough_creep(Creep copy, int d)
    {
    	super(copy, d);
    }
}